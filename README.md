Request for Help: Sensor Data Visualization Graph Development
I am working on a project that receives data packets in the following format:
35064|A0114116:A180471:A241436:A342198:D0133661:D171186:F022355:F1148064:S00:S11:S20:S31
The vertical bar | separates the timestamp from the sensor data.
The colon : separates each sensor reading.
The first 2 characters of each reading indicate the sensor name (e.g., A0, F1, S3).
The remaining characters represent the sensor value (e.g., A0114116 → sensor A0, value 114116).
I need help developing a dynamic graphing system for these sensor readings. The requirements are:
The graph should be displayed under the timer on the interface.
It must allow viewing individual sensor graphs when a button for that sensor is pressed.
Users should be able to add or remove sensors from the graph dynamically.
Ideally, multiple sensor graphs can be shown at the same time, each corresponding to a selected sensor.
The graph should update as new data packets are received, showing trends over time.
If anyone has experience with real-time data visualization, JavaScript charting libraries (like Chart.js, D3.js, or Plotly), or dynamic UI design, your help would be greatly appreciated.
I have a dedicated space under the timer where this graph should be implemented, so the layout is already partially planned. The goal is to make it interactive, flexible, and easy to use for monitoring all sensors.
Thank you in advance for any guidance, suggestions, or contributions!
