package com.example.backend.controllers;

import com.example.backend.services.storage.S3StorageProviderWithPresignedUrls;
import com.example.backend.services.storage.StorageProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for handling file access URLs
 * Generates pre-signed URLs for private S3 files
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final StorageProvider storageProvider;

    /**
     * Get a temporary URL for accessing a file
     */
    @GetMapping("/url")
    public ResponseEntity<Map<String, String>> getFileUrl(@RequestParam String objectKey) {
        try {
            String url;

            if (storageProvider instanceof S3StorageProviderWithPresignedUrls) {
                S3StorageProviderWithPresignedUrls s3Provider =
                        (S3StorageProviderWithPresignedUrls) storageProvider;

                // Generate pre-signed URL valid for 24 hours
                url = s3Provider.generatePresignedUrl(objectKey, Duration.ofHours(24));

            } else {
                url = storageProvider.getPublicUrl(objectKey);
            }

            Map<String, String> response = new HashMap<>();
            response.put("url", url);
            response.put("objectKey", objectKey);

            log.debug("Generated URL for: {}", objectKey);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to generate URL for: {}", objectKey, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get temporary URLs for multiple files at once
     */
    @GetMapping("/urls")
    public ResponseEntity<Map<String, String>> getMultipleFileUrls(
            @RequestParam String objectKeys) {

        try {
            String[] keys = objectKeys.split(",");
            Map<String, String> urls = new HashMap<>();

            for (String key : keys) {
                key = key.trim();

                if (storageProvider instanceof S3StorageProviderWithPresignedUrls) {
                    S3StorageProviderWithPresignedUrls s3Provider =
                            (S3StorageProviderWithPresignedUrls) storageProvider;

                    String url = s3Provider.generatePresignedUrl(key, Duration.ofHours(24));
                    urls.put(key, url);
                } else {
                    urls.put(key, storageProvider.getPublicUrl(key));
                }
            }

            log.debug("Generated {} URLs", urls.size());
            return ResponseEntity.ok(urls);

        } catch (Exception e) {
            log.error("Failed to generate multiple URLs", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Check if a file exists in storage
     */
    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> checkFileExists(
            @RequestParam String objectKey) {

        try {
            boolean exists = storageProvider.fileExists(objectKey);

            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", exists);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to check file existence: {}", objectKey, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}