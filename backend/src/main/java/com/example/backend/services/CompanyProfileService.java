package com.example.backend.services;

import com.example.backend.models.CompanyProfile;
import com.example.backend.repositories.CompanyProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyProfileService {

    private final CompanyProfileRepository repository;
    private final StorageService storageService;

    public CompanyProfile getProfile() {
        return repository.findAll().stream().findFirst().orElseGet(this::createDefaultProfile);
    }

    public CompanyProfile updateProfile(CompanyProfile updatedProfile) {
        CompanyProfile existing = getProfile();

        existing.setCompanyName(updatedProfile.getCompanyName());
        existing.setCompanyNameArabic(updatedProfile.getCompanyNameArabic());
        existing.setAddress(updatedProfile.getAddress());
        existing.setPhone(updatedProfile.getPhone());
        existing.setEmail(updatedProfile.getEmail());
        existing.setTaxId(updatedProfile.getTaxId());
        existing.setCommercialRegister(updatedProfile.getCommercialRegister());
        existing.setFooterText(updatedProfile.getFooterText());

        // Don't update logoUrl here, handled separately

        return repository.save(existing);
    }

    public CompanyProfile updateLogo(MultipartFile file) {
        CompanyProfile existing = getProfile();

        String logoUrl = storageService.storeFile(file, "company-assets");
        existing.setLogoUrl(logoUrl);

        return repository.save(existing);
    }

    private CompanyProfile createDefaultProfile() {
        log.info("Creating default company profile");
        CompanyProfile defaultProfile = CompanyProfile.builder()
                .companyName("ElGuindy Glass Co.")
                .companyNameArabic("شركة الجندي للزجاج")
                .address("New Cairo, Fifth Settlement")
                .phone("+20 123 456 789")
                .email("info@elguindyglass.com")
                .footerText("ElGuindy Glass Co. | New Cairo | +20 123 456 789")
                .build();
        return repository.save(defaultProfile);
    }
}
