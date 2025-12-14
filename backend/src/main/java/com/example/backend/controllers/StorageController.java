package com.example.backend.controllers;

import com.example.backend.services.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/api/v1/storage")
@RequiredArgsConstructor
@Slf4j
public class StorageController {

    private final StorageService storageService;

    /**
     * Proxy endpoint to redirect to the actual file URL (e.g. S3 presigned URL).
     * This allows us to use stable URLs in the frontend even if the underlying
     * signed URLs expire.
     */
    @GetMapping("/proxy")
    public RedirectView proxyFile(@RequestParam String key) {
        log.debug("Proxying file request for key: {}", key);

        String temporaryUrl = storageService.getTemporaryUrl(key);

        if (temporaryUrl == null) {
            log.warn("Could not generate temporary URL for key: {}", key);
            // Redirect to a 404 page or return 404?
            // RedirectView logic typically expects a URL.
            // If null, maybe redirect to error?
            return new RedirectView("/404");
        }

        return new RedirectView(temporaryUrl);
    }
}
