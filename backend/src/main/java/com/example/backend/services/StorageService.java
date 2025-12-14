package com.example.backend.services;

import com.example.backend.services.storage.StorageProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Service wrapper for storage operations
 * Delegates to the configured StorageProvider (MinIO or S3)
 */
@Service
@Slf4j
public class StorageService {

    private final StorageProvider storageProvider;

    public StorageService(StorageProvider storageProvider) {
        this.storageProvider = storageProvider;
        log.info("📦 StorageService initialized with provider: {}",
                storageProvider.getClass().getSimpleName());
    }

    public String storePdf(byte[] pdfBytes, String fileName, String folder) {
        if (!storageProvider.isEnabled()) {
            log.warn("⚠️ Storage is disabled. Cannot store PDF.");
            return null;
        }
        return storageProvider.storePdf(pdfBytes, fileName, folder);
    }

    public String storePdf(InputStream inputStream, String fileName, String folder) {
        if (!storageProvider.isEnabled()) {
            log.warn("⚠️ Storage is disabled. Cannot store PDF.");
            return null;
        }
        return storageProvider.storePdf(inputStream, fileName, folder);
    }

    public String storeFile(MultipartFile file, String folder) {
        if (!storageProvider.isEnabled()) {
            log.warn("⚠️ Storage is disabled. Cannot store file.");
            return null;
        }
        return storageProvider.storeFile(file, folder);
    }

    public InputStream getFile(String objectName) {
        if (!storageProvider.isEnabled()) {
            log.warn("⚠️ Storage is disabled. Cannot retrieve file.");
            return null;
        }
        return storageProvider.getFile(objectName);
    }

    public void deleteFile(String objectName) {
        if (!storageProvider.isEnabled()) {
            log.warn("⚠️ Storage is disabled. Cannot delete file.");
            return;
        }
        storageProvider.deleteFile(objectName);
    }

    public boolean fileExists(String objectName) {
        if (!storageProvider.isEnabled()) {
            return false;
        }
        return storageProvider.fileExists(objectName);
    }

    public String getPublicUrl(String objectName) {
        if (!storageProvider.isEnabled()) {
            log.warn("⚠️ Storage is disabled. Cannot generate public URL.");
            return null;
        }
        return storageProvider.getPublicUrl(objectName);
    }

    public String getTemporaryUrl(String objectName) {
        if (!storageProvider.isEnabled()) {
            return null;
        }
        return storageProvider.getTemporaryUrl(objectName);
    }

    public String extractObjectName(String publicUrl) {
        if (!storageProvider.isEnabled()) {
            return null;
        }
        return storageProvider.extractObjectName(publicUrl);
    }

    public boolean isEnabled() {
        return storageProvider.isEnabled();
    }
}