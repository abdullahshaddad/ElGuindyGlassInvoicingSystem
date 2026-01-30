package com.example.backend.controllers;

import com.example.backend.models.CompanyProfile;
import com.example.backend.services.CompanyProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/company-profile")
@RequiredArgsConstructor
@Slf4j
public class CompanyProfileController {

    private final CompanyProfileService service;

    @GetMapping
    public ResponseEntity<CompanyProfile> getProfile() {
        return ResponseEntity.ok(service.getProfile());
    }

    @PostMapping
    public ResponseEntity<CompanyProfile> updateProfile(@RequestBody CompanyProfile profile) {
        return ResponseEntity.ok(service.updateProfile(profile));
    }

    @PostMapping("/logo")
    public ResponseEntity<CompanyProfile> updateLogo(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.updateLogo(file));
    }

    @GetMapping("/logo")
    public ResponseEntity<byte[]> getLogo() {
        try {
            byte[] logoBytes = service.getLogoBytes();
            if (logoBytes == null) {
                return ResponseEntity.notFound().build();
            }

            String contentType = service.getLogoContentType();
            if (contentType == null) {
                contentType = "image/png";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"logo\"")
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400") // Cache for 24 hours
                    .body(logoBytes);

        } catch (Exception e) {
            log.error("Error serving logo: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
