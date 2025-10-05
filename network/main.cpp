#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* endpoint = "https://example.com/api/receive";

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
    Serial.println(WiFi.localIP());

    WiFiClientSecure client;
    //client.setInsecure();

    HTTPClient https;
    https.begin(client, endpoint);
    https.addHeader("Content-Type", "application/json");

    String payload = "{\"device\": \"esp32cam\", \"msg\": \"hello from PlatformIO\"}";
    int code = https.POST(payload);

    Serial.printf("HTTPS Response Code: %d\n", code);
    if (code > 0) {
        Serial.println(https.getString());
    } else {
        Serial.printf("Error: %s\n", https.errorToString(code).c_str());
    }

    https.end();
}

void loop() {
  // empty — seconds one frame
    if (WiFi.status() == WL_CONNECTED) {
        https.begin(client, endpoint);
        https.addHeader("Content-Type", "application/json");

        String payload = "{\"device\": \"esp32cam\", \"msg\": \"frame data here\"}";
        int code = https.POST(payload);

        Serial.printf("HTTPS Response Code: %d\n", code);
        if (code > 0) {
        Serial.println(https.getString());
        } else {
        Serial.printf("Error: %s\n", https.errorToString(code).c_str());
        }

        https.end();
    } else {
        Serial.println("WiFi disconnected, reconnecting...");
        WiFi.begin(ssid, password);
    }

    delay(3000); // wait 3 seconds before sending next frame
}
