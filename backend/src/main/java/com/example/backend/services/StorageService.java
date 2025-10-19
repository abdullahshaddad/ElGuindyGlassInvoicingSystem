package com.example.backend.services;

import io.minio.*;
import io.minio.errors.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
public class StorageService {

    private final MinioClient minioClient;
    private final String bucketName;
    private final String publicUrl;
    private final boolean enabled;

    public StorageService(
            @Value("${minio.endpoint:http://localhost:9000}") String endpoint,
            @Value("${minio.accessKey:minioadmin}") String accessKey,
            @Value("${minio.secretKey:minioadmin}") String secretKey,
            @Value("${minio.bucketName:elguindy}") String bucketName,
            @Value("${minio.publicUrl:http://localhost:9000}") String publicUrl,
            @Value("${minio.enabled:false}") boolean enabled) {

        this.enabled = enabled;

        if (enabled) {
            this.minioClient = MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .build();
            this.bucketName = bucketName;
            this.publicUrl = publicUrl;

            initializeBucket();
        } else {
            log.warn("MinIO storage is disabled");
            this.minioClient = null;
            this.bucketName = null;
            this.publicUrl = null;
        }
    }

    /**
     * Initialize MinIO bucket if it doesn't exist
     */
    private void initializeBucket() {
        if (!enabled) return;

        try {
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                log.info("Created MinIO bucket: {}", bucketName);
            } else {
                log.info("MinIO bucket already exists: {}", bucketName);
            }
        } catch (Exception e) {
            log.warn("Could not initialize MinIO bucket: {}", e.getMessage());
        }
    }

    /**
     * Store PDF file in MinIO and return the public URL
     * @param pdfBytes PDF file content as byte array
     * @param fileName Original file name
     * @param folder Folder path (e.g., "invoices", "stickers")
     * @return Public URL of the stored file
     */
    public String storePdf(byte[] pdfBytes, String fileName, String folder) {
        if (!enabled) {
            log.warn("MinIO storage is disabled. Cannot store PDF.");
            return null;
        }

        try {
            // Generate unique file name with timestamp
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String uniqueFileName = String.format("%s_%s_%s",
                    timestamp, UUID.randomUUID().toString().substring(0, 8), fileName);

            String objectName = String.format("%s/%s", folder, uniqueFileName);

            // Upload to MinIO
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(new ByteArrayInputStream(pdfBytes), pdfBytes.length, -1)
                    .contentType("application/pdf")
                    .build());

            String publicUrl = String.format("%s/%s/%s", this.publicUrl, bucketName, objectName);
            log.info("PDF stored successfully: {}", publicUrl);

            return publicUrl;

        } catch (Exception e) {
            log.error("Error storing PDF file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to store PDF file", e);
        }
    }

    /**
     * Store PDF file from InputStream
     * @param inputStream PDF file input stream
     * @param fileName Original file name
     * @param folder Folder path
     * @return Public URL of the stored file
     */
    public String storePdf(InputStream inputStream, String fileName, String folder) {
        if (!enabled) {
            log.warn("MinIO storage is disabled. Cannot store PDF.");
            return null;
        }

        try {
            // Generate unique file name
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String uniqueFileName = String.format("%s_%s_%s",
                    timestamp, UUID.randomUUID().toString().substring(0, 8), fileName);

            String objectName = String.format("%s/%s", folder, uniqueFileName);

            // Upload to MinIO
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(inputStream, -1, 10485760) // 10MB max
                    .contentType("application/pdf")
                    .build());

            String publicUrl = String.format("%s/%s/%s", this.publicUrl, bucketName, objectName);
            log.info("PDF stored successfully: {}", publicUrl);

            return publicUrl;

        } catch (Exception e) {
            log.error("Error storing PDF file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to store PDF file", e);
        }
    }

    /**
     * Store MultipartFile in MinIO
     * @param file MultipartFile to store
     * @param folder Folder path
     * @return Public URL of the stored file
     */
    public String storeFile(MultipartFile file, String folder) {
        if (!enabled) {
            log.warn("MinIO storage is disabled. Cannot store file.");
            return null;
        }

        try {
            return storePdf(file.getInputStream(), file.getOriginalFilename(), folder);
        } catch (IOException e) {
            log.error("Error reading multipart file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to read file", e);
        }
    }

    /**
     * Get file from MinIO as InputStream
     * @param objectName Object name in MinIO
     * @return InputStream of the file
     */
    public InputStream getFile(String objectName) {
        if (!enabled) {
            log.warn("MinIO storage is disabled. Cannot retrieve file.");
            return null;
        }

        try {
            return minioClient.getObject(GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            log.error("Error retrieving file {}: {}", objectName, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve file", e);
        }
    }

    /**
     * Delete file from MinIO
     * @param objectName Object name in MinIO
     */
    public void deleteFile(String objectName) {
        if (!enabled) {
            log.warn("MinIO storage is disabled. Cannot delete file.");
            return;
        }

        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
            log.info("File deleted successfully: {}", objectName);
        } catch (Exception e) {
            log.error("Error deleting file {}: {}", objectName, e.getMessage(), e);
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    /**
     * Check if file exists in MinIO
     * @param objectName Object name in MinIO
     * @return true if file exists, false otherwise
     */
    public boolean fileExists(String objectName) {
        if (!enabled) {
            log.warn("MinIO storage is disabled. Cannot check file existence.");
            return false;
        }

        try {
            minioClient.statObject(StatObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Generate public URL for a stored file
     * @param objectName Object name in MinIO
     * @return Public URL
     */
    public String getPublicUrl(String objectName) {
        if (!enabled) {
            log.warn("MinIO storage is disabled. Cannot generate public URL.");
            return null;
        }

        return String.format("%s/%s/%s", publicUrl, bucketName, objectName);
    }

    /**
     * Extract object name from public URL
     * @param publicUrl Public URL of the file
     * @return Object name
     */
    public String extractObjectName(String publicUrl) {
        if (publicUrl == null || !publicUrl.contains(bucketName)) {
            return null;
        }

        String[] parts = publicUrl.split(bucketName + "/");
        if (parts.length > 1) {
            return parts[1];
        }
        return null;
    }
}