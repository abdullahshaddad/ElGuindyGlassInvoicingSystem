package com.example.backend.controllers;

import com.example.backend.models.CompanyProfile;
import com.example.backend.services.CompanyProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

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
    public ResponseEntity<Resource> getLogo() {
        try {
            String logoPath = service.getLogoPath();
            if (logoPath == null) {
                return ResponseEntity.notFound().build();
            }

            Path path = Paths.get(logoPath);
            if (!Files.exists(path)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(path);
            String contentType = Files.probeContentType(path);
            if (contentType == null) {
                contentType = "image/png";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"logo\"")
                    .body(resource);

        } catch (Exception e) {
            log.error("Error serving logo: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
