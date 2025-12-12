package com.example.backend.services.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * AWS S3 implementation with PRE-SIGNED URLs for private buckets
 */
@Slf4j
public class S3StorageProviderWithPresignedUrls implements StorageProvider {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;
    private final String region;
    private final boolean enabled;

    public S3StorageProviderWithPresignedUrls(String accessKey, String secretKey, String bucketName,
            String region, boolean enabled) {
        this.enabled = enabled;
        this.bucketName = bucketName;
        this.region = region;

        if (enabled) {
            AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKey, secretKey);

            this.s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                    .build();

            this.s3Presigner = S3Presigner.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                    .build();

            log.info("✅ AWS S3 Storage with Pre-signed URLs initialized");
        } else {
            this.s3Client = null;
            this.s3Presigner = null;
        }
    }

    @Override
    public String storePdf(byte[] pdfBytes, String fileName, String folder) {
        return storeBytes(pdfBytes, fileName, folder, "application/pdf");
    }

    @Override
    public String storePdf(InputStream inputStream, String fileName, String folder) {
        if (!enabled) {
            log.warn("S3 storage is disabled");
            return null;
        }

        try {
            byte[] bytes = inputStream.readAllBytes();
            return storeBytes(bytes, fileName, folder, "application/pdf");
        } catch (IOException e) {
            log.error("❌ Failed to read input stream: {}", e.getMessage());
            throw new RuntimeException("Failed to read input stream", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file, String folder) {
        if (!enabled) {
            log.warn("S3 storage is disabled");
            return null;
        }

        try {
            String contentType = file.getContentType();
            if (contentType == null || contentType.isEmpty()) {
                contentType = "application/octet-stream";
            }
            return storeBytes(file.getBytes(), file.getOriginalFilename(), folder, contentType);
        } catch (IOException e) {
            log.error("❌ Failed to read multipart file: {}", e.getMessage());
            throw new RuntimeException("Failed to read file", e);
        }
    }

    private String storeBytes(byte[] bytes, String fileName, String folder, String contentType) {
        if (!enabled) {
            log.warn("S3 storage is disabled");
            return null;
        }

        try {
            String uniqueFileName = generateUniqueFileName(fileName);
            String key = folder + "/" + uniqueFileName;

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes));

            log.info("✅ File stored in S3: {} (Type: {})", key, contentType);
            return key;

        } catch (S3Exception e) {
            log.error("❌ Failed to store file in S3: {}", e.getMessage());
            throw new RuntimeException("Failed to store file in S3", e);
        }
    }

    @Override
    public InputStream getFile(String objectName) {
        if (!enabled) {
            log.warn("S3 storage is disabled");
            return null;
        }

        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .build();

            return s3Client.getObject(getObjectRequest);

        } catch (S3Exception e) {
            log.error("❌ Failed to retrieve file from S3: {}", e.getMessage());
            throw new RuntimeException("Failed to retrieve file from S3", e);
        }
    }

    @Override
    public void deleteFile(String objectName) {
        if (!enabled) {
            log.warn("S3 storage is disabled");
            return;
        }

        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("✅ File deleted from S3: {}", objectName);

        } catch (S3Exception e) {
            log.error("❌ Failed to delete file from S3: {}", e.getMessage());
            throw new RuntimeException("Failed to delete file from S3", e);
        }
    }

    @Override
    public boolean fileExists(String objectName) {
        if (!enabled) {
            return false;
        }

        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;

        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            log.error("❌ Error checking file existence in S3: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String getPublicUrl(String objectName) {
        if (!enabled) {
            return null;
        }
        return generatePresignedUrl(objectName, Duration.ofHours(1));
    }

    public String generatePresignedUrl(String objectKey, Duration duration) {
        if (!enabled) {
            return null;
        }

        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(duration)
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

            String url = presignedRequest.url().toString();
            log.debug("Generated pre-signed URL valid for {} hours", duration.toHours());

            return url;

        } catch (S3Exception e) {
            log.error("❌ Failed to generate pre-signed URL: {}", e.getMessage());
            throw new RuntimeException("Failed to generate pre-signed URL", e);
        }
    }

    @Override
    public String extractObjectName(String publicUrl) {
        if (publicUrl == null) {
            return null;
        }

        if (publicUrl.contains("?")) {
            publicUrl = publicUrl.substring(0, publicUrl.indexOf("?"));
        }

        try {
            if (publicUrl.contains(bucketName + ".s3.")) {
                String[] parts = publicUrl.split(bucketName + ".s3.[^/]+/");
                return parts.length > 1 ? parts[1] : null;
            } else if (publicUrl.contains("s3.") && publicUrl.contains(bucketName)) {
                String[] parts = publicUrl.split(bucketName + "/");
                return parts.length > 1 ? parts[1] : null;
            }
        } catch (Exception e) {
            log.error("Failed to extract object name from URL: {}", publicUrl);
        }

        if (!publicUrl.startsWith("http")) {
            return publicUrl;
        }

        return null;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    private String generateUniqueFileName(String originalFileName) {
        String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("%s_%s_%s", timestamp, uuid, originalFileName);
    }
}