Data Packet Format
Example of a data packet:
35064|A0114116:A180471:A241436:A342198:D0133661:D171186:F022355:F1148064:S00:S11:S20:S31
The vertical bar (|) separates the timestamp from the main data.
The colon (:) separates individual sensor data entries.
A0114116 means sensor A0 with value 114116.
F1148064 means sensor F1 with value 148064.
S31 means sensor S3 with value 1.
Note: The sensor name is always the first two characters, and the remaining characters represent the sensor value.
Feature Request: Sensor Graphs
We need help developing a dynamic graphing system for the sensors:
Graphs should be displayed below the timer area.
Each sensor should have its own graph, and the user should be able to select which sensor's graph to view by pressing buttons.
It should be possible to add new graphs or remove existing ones dynamically.
The interface should allow viewing multiple sensor graphs at the same time, updating in real-time as new data arrives.
Contributions are welcome for implementing this graphing functionality, using JavaScript chart libraries (like Chart.js, D3.js, or others), or any other approach that allows interactive graph management.
