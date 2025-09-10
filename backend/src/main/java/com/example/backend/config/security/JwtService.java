package com.example.backend.config.security;

import com.example.backend.models.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String JWT_SECRET = "633292096cab01eb8f5100d1f3e0bcb0e0e704b2ab78d2706c4650ea3cfd586e863a33ea7318ee7d851682618ec773060a2ba86deb7490dc84e32bd10112a29d713ba96acbf2ad2a61480a99f3c4999be4f40fbc0dde04bb13cf9c9c84a6084abeb15677bca2d440778d3eaabbae1f42640a16d5913865559fb5e6d2d65f851cfe9c39e78f5fd26b1cdc5d04a27188779928161375af1f74acdd6b80749d1983f4c2aa8bacbb5cf7d67f7f0c52cda907a60c735e32a2d53e4f506821e8cb6e83059890b178a9e5b2e06acc040064c4697e4685d7a0c1bf521ff2a437469234fabb03fd884292606b604afcd0337a0805e32a7ad8c335f5d8ba51c2b1e300ca84ae6f5b8366c890cf662449d41d7e64b2437cd506e9123e0fa73b0a1f53d7619c";


    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);

    }

    public boolean isTokenValid(String token, User user) {
        final String username = extractUsername(token);
        return (username.equals(user.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractClaimsJWT(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractClaimsJWT(String token) {
        return Jwts.parser().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    }

    private Key getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(JWT_SECRET);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        return generateToken(new HashMap<>(), user);
    }

    public String generateToken(Map<String, Object> extraClaims, User user) {
        return Jwts.builder().setClaims(extraClaims).setSubject(user.getUsername()).
                setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 1000))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }
}