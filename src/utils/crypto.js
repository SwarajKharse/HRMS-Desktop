import CryptoJS from "crypto-js";

// Use a secret key (store it securely—remember that embedding secrets in client-side code only obfuscates the data)
const secretKey = "swaraj";

export const encryptId = (id) => {
  const encrypted = CryptoJS.AES.encrypt(id.toString(), secretKey).toString();
  // Convert to URL safe Base64: replace "/" and "+" and remove "="
  return encrypted
    .replace(/\//g, '_')
    .replace(/\+/g, '-')
    .replace(/=+$/, '');
};

export const decryptId = (encryptedId) => {
  // Reverse the URL safe transformation:
  let base64 = encryptedId
    .replace(/_/g, '/')
    .replace(/-/g, '+');
  
  // Add padding if needed (Base64 strings should be a multiple of 4 in length)
  while (base64.length % 4) {
    base64 += '=';
  }
  
  const bytes = CryptoJS.AES.decrypt(base64, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
