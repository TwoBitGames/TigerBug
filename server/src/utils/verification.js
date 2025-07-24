const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateVerificationExpiry = () => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
};

const isVerificationCodeValid = (code, storedCode, expiry) => {
  if (!code || !storedCode || !expiry) {
    return false;
  }
  
  if (code !== storedCode) {
    return false;
  }
  
  if (new Date() > new Date(expiry)) {
    return false;
  }
  
  return true;
};

module.exports = {
  generateVerificationCode,
  generateVerificationExpiry,
  isVerificationCodeValid,
};
