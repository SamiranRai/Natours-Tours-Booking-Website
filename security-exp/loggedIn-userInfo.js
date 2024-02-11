const geoip = require("geoip-lite");
const useragent = require("express-useragent");
const sendEmail = require("./../utils/email");

osDetectionEmailSender = async (req, user) => {
  // Get user information
  const userIpAddress = req.ip;
  const userAgent = req.useragent;
  const userLocation = geoip.lookup(userIpAddress); // Use geoip-lite to get location based on IP

  // Create a login confirmation message
  const confirmationMessage = `
          Hello, ${user.name}!
      
          Your account was just logged into from the following details:
      
          - IP Address: ${userIpAddress}
          - Location: ${
            userLocation
              ? `${userLocation.city}, ${userLocation.country}`
              : "Unknown"
          }
          - Latitude and Longitude: ${
            userLocation
              ? `${userLocation.ll[0]}, ${userLocation.ll[1]}`
              : "Unknown"
          }
          - Browser: ${userAgent.browser}
          - OS: ${userAgent.os}
      
          If this was you, no further action is needed. If you did not log in, please contact us immediately.
        `;

  try {
    //Send a Login'info email to the user...
    await sendEmail({
      email: user.email,
      subject: "Some One Login to your account...",
      confirmationMessage,
    });

    console.log(confirmationMessage);
  } catch (error) {
    console.error("Error fetching IP info:", error);
    console.log("Error sending loged In user info email..");
  }
};

module.exports = osDetectionEmailSender;
