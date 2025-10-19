package com.example.backend.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
@Slf4j
public class DisabledStorageService {
    public DisabledStorageService() {
        log.info("Storage service is disabled for this environment");
    }

    public String storePdf(byte[] pdfBytes, String fileName, String folder) {
        log.warn("Storage service is disabled. PDF storage skipped.");
        return null;
    }

    public String storePdf(InputStream inputStream, String fileName, String folder) {
        log.warn("Storage service is disabled. PDF storage skipped.");
        return null;
    }

    public String storeFile(MultipartFile file, String folder) {
        log.warn("Storage service is disabled. File storage skipped.");
        return null;
    }

    public InputStream getFile(String objectName) {
        log.warn("Storage service is disabled. File retrieval skipped.");
        return null;
    }

    public void deleteFile(String objectName) {
        log.warn("Storage service is disabled. File deletion skipped.");
    }

    public boolean fileExists(String objectName) {
        log.warn("Storage service is disabled. File existence check skipped.");
        return false;
    }

    public String getPublicUrl(String objectName) {
        log.warn("Storage service is disabled. Public URL generation skipped.");
        return null;
    }

    public String extractObjectName(String publicUrl) {
        log.warn("Storage service is disabled. Object name extraction skipped.");
        return null;
    }
}