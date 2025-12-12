package com.example.backend.services.storage;

import io.minio.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * MinIO implementation of StorageProvider for local development
 */
@Slf4j
public class MinioStorageProvider implements StorageProvider {

    private final MinioClient minioClient;
    private final String bucketName;
    private final String publicUrl;
    private final boolean enabled;

    public MinioStorageProvider(String endpoint, String accessKey, String secretKey,
                                String bucketName, String publicUrl, boolean enabled) {
        this.enabled = enabled;
        this.bucketName = bucketName;
        this.publicUrl = publicUrl;

        if (enabled) {
            this.minioClient = MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .build();
            initializeBucket();
        } else {
            this.minioClient = null;
        }
    }

    private void initializeBucket() {
        try {
            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build()
            );

            if (!bucketExists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucketName).build()
                );
                log.info("✅ Created MinIO bucket: {}", bucketName);
            } else {
                log.info("✅ MinIO bucket already exists: {}", bucketName);
            }
        } catch (Exception e) {
            log.warn("Could not initialize MinIO bucket: {}", e.getMessage());
        }
    }

    @Override
    public String storePdf(byte[] pdfBytes, String fileName, String folder) {
        if (!enabled) {
            log.warn("MinIO storage is disabled");
            return null;
        }

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(pdfBytes)) {
            return storePdf(inputStream, fileName, folder);
        } catch (IOException e) {
            log.error("Error reading PDF bytes: {}", e.getMessage());
            throw new RuntimeException("Failed to store PDF", e);
        }
    }

    @Override
    public String storePdf(InputStream inputStream, String fileName, String folder) {
        if (!enabled) {
            log.warn("MinIO storage is disabled");
            return null;
        }

        try {
            String uniqueFileName = generateUniqueFileName(fileName);
            String objectName = folder + "/" + uniqueFileName;

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, -1, 10485760)
                            .contentType("application/pdf")
                            .build()
            );

            String publicUrl = getPublicUrl(objectName);
            log.info("✅ PDF stored in MinIO: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("❌ Failed to store PDF in MinIO: {}", e.getMessage());
            throw new RuntimeException("Failed to store PDF", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file, String folder) {
        if (!enabled) {
            log.warn("MinIO storage is disabled");
            return null;
        }

        try {
            return storePdf(file.getInputStream(), file.getOriginalFilename(), folder);
        } catch (IOException e) {
            log.error("Error reading multipart file: {}", e.getMessage());
            throw new RuntimeException("Failed to read file", e);
        }
    }

    @Override
    public InputStream getFile(String objectName) {
        if (!enabled) {
            log.warn("MinIO storage is disabled");
            return null;
        }

        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Failed to retrieve file from MinIO: {}", e.getMessage());
            throw new RuntimeException("Failed to retrieve file", e);
        }
    }

    @Override
    public void deleteFile(String objectName) {
        if (!enabled) {
            log.warn("MinIO storage is disabled");
            return;
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info("✅ File deleted from MinIO: {}", objectName);
        } catch (Exception e) {
            log.error("❌ Failed to delete file from MinIO: {}", e.getMessage());
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    @Override
    public boolean fileExists(String objectName) {
        if (!enabled) {
            return false;
        }

        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getPublicUrl(String objectName) {
        if (!enabled) {
            return null;
        }
        return String.format("%s/%s/%s", publicUrl, bucketName, objectName);
    }

    @Override
    public String extractObjectName(String publicUrl) {
        if (publicUrl == null || !publicUrl.contains(bucketName)) {
            return null;
        }

        String[] parts = publicUrl.split(bucketName + "/");
        return parts.length > 1 ? parts[1] : null;
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