import CryptoJS from "crypto-js";

// Use a secret key (store it securely—remember that embedding secrets in client-side code only obfuscates the data)
const secretKey = "swaraj";

export const encryptId = (id) => {
  return CryptoJS.AES.encrypt(id.toString(), secretKey).toString();
};

export const decryptId = (encryptedId) => {
  const bytes = CryptoJS.AES.decrypt(encryptedId, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
