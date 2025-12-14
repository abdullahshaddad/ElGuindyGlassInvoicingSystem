package com.example.backend.services.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Interface for storage providers (MinIO, S3, etc.)
 */
public interface StorageProvider {

    String storePdf(byte[] pdfBytes, String fileName, String folder);

    String storePdf(InputStream inputStream, String fileName, String folder);

    String storeFile(MultipartFile file, String folder);

    InputStream getFile(String objectName);

    void deleteFile(String objectName);

    boolean fileExists(String objectName);

    String getPublicUrl(String objectName);

    /**
     * Get a temporary (signed) URL for the object.
     * For providers with permanent public URLs (like MinIO public buckets), this
     * may allow returning same as getPublicUrl.
     */
    default String getTemporaryUrl(String objectName) {
        return getPublicUrl(objectName);
    }

    String extractObjectName(String publicUrl);

    boolean isEnabled();
}