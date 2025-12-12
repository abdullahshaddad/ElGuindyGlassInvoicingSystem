package com.example.backend.controllers;

import com.example.backend.models.CompanyProfile;
import com.example.backend.services.CompanyProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/company-profile")
@RequiredArgsConstructor
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
}
