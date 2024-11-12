#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

const char* ssid = "khanh";
const char* password = "1234567899";
const char* mqttServer = "192.168.71.243";
const int mqttPort = 1884;
const char* mqttUser = "khanh";
const char* mqttPassword = "b21dccn451";

#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define LED1_PIN 19
#define LED2_PIN 21
#define LED3_PIN 22

WiFiClient espClient;
PubSubClient client(espClient);

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Kết nối đến WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("Đã kết nối đến WiFi");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Kết nối đến MQTT...");
    if (client.connect("ESP32Client", mqttUser, mqttPassword)) {
      Serial.println("Đã kết nối");
      client.subscribe("controldevice");
    } else {
      Serial.print("Lỗi, mã lỗi = ");
      Serial.print(client.state());
      delay(2000);
    }
  }
}

void sendSensorData() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  // Đọc giá trị analog từ chân cảm biến ánh sáng
  int lightAnalogValue = analogRead(34);

  // Chuyển đổi giá trị analog sang lux (công thức ví dụ, cần hiệu chỉnh theo cảm biến)
  float lightLux = lightAnalogValue * (3.3 / 4095.0);  // Tính điện áp trên chân cảm biến
  lightLux = lightLux * 500; // Chuyển đổi điện áp sang lux (giả sử hệ số 500)

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Lỗi đọc dữ liệu từ cảm biến!");
    return;
  }

  String payload = String("{\"temperature\":") + temperature + ",\"humidity\":" + humidity + ",\"light\":" + lightLux + "}";
  client.publish("datasensor", payload.c_str());
  Serial.println("Gửi dữ liệu cảm biến: " + payload);
}

void handleControlCommand(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("Nhận lệnh điều khiển: " + message);
  
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  const char* device = doc["device"];
  bool status = doc["status"] == "ON";

  if (strcmp(device, "Đèn") == 0) {
    digitalWrite(LED1_PIN, status ? HIGH : LOW);
  } else if (strcmp(device, "Điều Hòa") == 0) {
    digitalWrite(LED2_PIN, status ? HIGH : LOW);
  } else if (strcmp(device, "Quạt") == 0) {
    digitalWrite(LED3_PIN, status ? HIGH : LOW);
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  
  setupWiFi();
  client.setServer(mqttServer, mqttPort);
  client.setCallback(handleControlCommand);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  static unsigned long lastSendTime = 0;
  if (millis() - lastSendTime > 30000) {
    sendSensorData();
    lastSendTime = millis();
  }
}
