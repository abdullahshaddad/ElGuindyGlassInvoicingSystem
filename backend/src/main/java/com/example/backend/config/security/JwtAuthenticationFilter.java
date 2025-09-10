package com.example.backend.config.security;

import com.example.backend.models.user.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;  // This field needs proper initialization

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            final String authorizationHeader = request.getHeader("Authorization");
            System.out.println("Auth Header: " + authorizationHeader);
            System.out.println("Request Path: " + request.getRequestURI());

            final String token;
            final String username;

            // If no Authorization header or doesn't start with Bearer, continue filter chain
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                System.out.println("No valid authorization header found");
                filterChain.doFilter(request, response);
                return;
            }

            // Extract token from header
            token = authorizationHeader.substring(7);
            System.out.println("Token extracted: " + (token.length() > 10 ? token.substring(0, 10) + "..." : token));

            try {
                // Extract username from token
                username = jwtService.extractUsername(token);
                System.out.println("Username extracted: " + username);

                // If username is valid and no authentication is set yet
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Load user details
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    System.out.println("User loaded: " + userDetails.getUsername());
                    System.out.println("User authorities: " + userDetails.getAuthorities());

                    // Validate token
                    if (jwtService.isTokenValid(token, (User) userDetails)) {
                        System.out.println("Token is valid");

                        // Create authentication token
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities());

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        // Set authentication in context
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        System.out.println("Authentication set in SecurityContext");
                    } else {
                        System.out.println("Token validation failed");
                    }
                }
            } catch (Exception e) {
                System.out.println("Error processing JWT token: " + e.getMessage());
                e.printStackTrace();
            }

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            System.out.println("Unexpected error in JWT filter: " + e.getMessage());
            e.printStackTrace();
            filterChain.doFilter(request, response);
        }
    }
}