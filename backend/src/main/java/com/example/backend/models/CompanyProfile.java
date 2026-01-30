package com.example.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "company_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "company_name_arabic")
    private String companyNameArabic;

    @Column(name = "address")
    private String address;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "tax_id")
    private String taxId;

    @Column(name = "commercial_register")
    private String commercialRegister;

    @Column(name = "logo_url")
    private String logoUrl;

    @Lob
    @Column(name = "logo_base64", columnDefinition = "TEXT")
    private String logoBase64;

    @Column(name = "logo_content_type")
    private String logoContentType;

    @Column(name = "footer_text")
    private String footerText;
}
