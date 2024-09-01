import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {css} from '@emotion/native';
import {useNavigation} from '@react-navigation/native';
import Header from '../components/Header';
import {LineChart} from 'react-native-chart-kit';
import axios from 'axios';
import {getStoredSectorList} from '../utils/LocalSectorList';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {API_URL} from '@env';
import DatePicker from 'react-native-date-picker';
import RNFS from 'react-native-fs';
import perf from '@react-native-firebase/perf';

const containerStyle = css`
  flex: 1;
  padding: 20px;
  background-color: #d3e8d3;
`;

const headerContainerStyle = css`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  margin-top: 10px;
`;

const headerStyle = css`
  font-size: 24px;
  font-weight: bold;
`;

const sectionHeaderStyle = css`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const textStyle = css`
  font-size: 24px;
  color: black;
  margin-bottom: 10px;
`;

const statsItemStyle = css`
  width: 100px;
  height: 100px;
  align-items: center;
  padding: 20px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const statsItemTitleStyle = css`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const pickerStyle = css`
  height: 50px;
  width: 150px;
  margin-bottom: 15px;
  margin-horizontal: 10px;
  background-color: white;
`;

const sectionBoxStyle = css`
  margin-vertical: 10px;
  background-color: white;
  padding: 12px;
  border-radius: 10px;
`;

const ReportScreen = () => {
  const navigation = useNavigation();
  const reportRef = useRef();
  const [selectedInterval, setSelectedInterval] = useState('daily');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedParameter, setSelectedParameter] = useState('');
  const [sectorList, setSectorList] = useState([]);
  const [parameterList, setParameterList] = useState([]);
  const [data, setData] = useState(null);
  const [anomalyData, setAnomalyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date()); // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false); // Show/Hide date picker
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  async function customReportScreenTrace() {
    try {
      const trace = await perf().startScreenTrace('reportScreen');
      await trace.stop();
    } catch (error) {
      console.error('Error starting the trace:', error);
    }
  }

  useEffect(() => {
    customReportScreenTrace();
    fetchSectorList();
    if (selectedSector) {
      fetchData(selectedInterval, selectedSector);
      fetchAnomaliesData(selectedInterval, selectedSector);
    }
  }, [selectedInterval, selectedSector, date, month]);

  const fetchSectorList = async () => {
    const storedSectorList = await getStoredSectorList();
    setSectorList(storedSectorList);
    if (storedSectorList.length > 0) {
      setSelectedSector(storedSectorList[0]); // Set the first sector as default
    }
  };

  const chartConfig = {
    backgroundColor: '#CFF3DF',
    backgroundGradientFrom: '#CFF3DF',
    backgroundGradientTo: '#CFF3DF',
    color: (opacity = 5) => `rgba(76, 175, 80, ${opacity})`,
    strokeWidth: 2,
    labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
    propsForLabels: {
      fontSize: 14,
      fontWeight: 'bold',
    },
  };

  const parameterNameMap = {
    surroundingTemperature: 'Surrounding Temperature (°C)',
    surroundingHumidity: 'Surrounding Humidity (%)',
    solutionTemperature: 'Solution Temperature (°C)',
    lightIntensity: 'Light Intensity (lx)',
    tds: 'TDS (ppm)',
    pH: 'pH',
    foggerTemperature: 'Fogger Temperature (°C)',
    foggerHumidity: 'Fogger Humidity (%)',
    foggerTrigger: 'Fogger Trigger',
    lowTdsTrigger: 'Low TDS Trigger',
    highTdsTrigger: 'High TDS Trigger',
    lowPhTrigger: 'Low pH Trigger',
    highPhTrigger: 'High pH Trigger',
  };

  const fetchData = async (interval, sectorId) => {
    const year = new Date().getFullYear(); // Use the current year or a state variable if year is also selectable
    const formattedMonth = month.toString().padStart(2, '0'); // Ensure month is two digits
    const monthDocId = `${year}-${formattedMonth}`;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/sector/getParameterData`, {
        sectorId,
        selectedInterval: interval,
        date: interval === 'daily' ? date : null,
        month: interval === 'monthly' ? monthDocId : null,
      });
      setData(response.data.parameterData);

      const parameters = Object.keys(response.data.parameterData || {});
      setParameterList(parameters);
      if (parameters.length > 0) {
        setSelectedParameter(parameters[0]); // Set the first parameter as default
      }
    } catch (error) {
      console.log('Error', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnomaliesData = async (interval, sectorId) => {
    const year = new Date().getFullYear(); // Use the current year or a state variable if year is also selectable
    const formattedMonth = month.toString().padStart(2, '0'); // Ensure month is two digits
    const monthDocId = `${year}-${formattedMonth}`;
    setLoading(true);
    console.log(date);
    console.log(monthDocId);
    try {
      const response = await axios.post(`${API_URL}/sector/getAnomaliesData`, {
        sectorId,
        selectedInterval: interval,
        date: interval === 'daily' ? date : null,
        month: interval === 'monthly' ? monthDocId : null,
      });
      const {anomalyData} = response.data;
      if (Array.isArray(anomalyData)) {
        setAnomalyData(anomalyData);
      } else {
        console.error('Invalid anomalies data format:', anomalyData);
        setAnomalyData([]);
      }
    } catch (error) {
      console.log('Error fetching anomalies data', error);
      setAnomalyData(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = values => {
    const valueArray = values.map(item => item.value);
    const average = valueArray.reduce((a, b) => a + b, 0) / valueArray.length;
    const Mean = Math.floor(average);
    const Max = Math.max(...valueArray);
    const Min = Math.min(...valueArray);

    return {Mean, Max, Min};
  };

  const processDataForChart = (values, interval) => {
    const actualValues = values.map(item => item.value);
    const predictionValues = values.map(item => item.prediction || 0);
    const anomalyPoints = values.map(item =>
      item.anomalyStatus ? Math.max(...actualValues) : null,
    );

    if (interval === 'daily') {
      const labels = values.map(item => item.timestamp.split('T')[1]);
      return {
        labels,
        actualData: actualValues,
        predictionData: predictionValues,
        anomalyData: anomalyPoints,
      };
    } else if (interval === 'monthly') {
      const daysMap = Array.from({length: 31}, (_, i) => i + 1).reduce(
        (acc, day) => {
          acc[day] = [];
          return acc;
        },
        {},
      );

      values.forEach(item => {
        const day = new Date(item.timestamp).getDate();
        if (!daysMap[day]) {
          daysMap[day] = []; // Ensure the array is initialized
        }
        daysMap[day].push(item.value);
      });

      const labels = Object.keys(daysMap);
      const actualData = labels.map(day => {
        const dayValues = daysMap[day];
        if (Array.isArray(dayValues) && dayValues.length > 0) {
          return dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
        }
        return 0; // Handle cases where no values are available
      });

      return {
        labels,
        actualData,
        predictionData: new Array(labels.length).fill(0),
        anomalyData: new Array(labels.length).fill(null),
      };
    }
  };

  const handleChartOverflow = labels => {
    const maxLabels = 5;
    const interval = Math.ceil(labels.length / maxLabels);
    return labels.map((label, index) => (index % interval === 0 ? label : ''));
  };

  const exportData = async () => {
    if (!date) {
      console.error('No date selected');
      return;
    }

    const selectedYear = date.getFullYear();
    const selectedMonth = date.getMonth() + 1; // Months are 0-based in JavaScript
    const selectedDay = date.getDate(); // Get the selected day

    // Fetch and process data based on selectedYear, selectedMonth, and selectedDay
    try {
      const response = await axios.post(`${API_URL}/sector/getDataForExport`, {
        sectorId: selectedSector,
        year: selectedYear,
        month: selectedMonth,
        day: selectedDay, // Pass day in the request
      });

      const csvData = convertToCSV(response.data); // Convert data to CSV
      const path = `${RNFS.DocumentDirectoryPath}/exported_data_${selectedYear}_${selectedMonth}_${selectedDay}.csv`;
      await RNFS.writeFile(path, csvData);
      Alert.alert('Export Successful', `File saved to ${path}`, [{text: 'OK'}]);
      console.log('File saved to', path);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const convertToCSV = data => {
    // Initialize CSV with headers for each parameter
    let csv =
      'Timestamp,Fogger Humidity,Fogger Temperature,Fogger Trigger,High pH Trigger,High TDS Trigger,Light Intensity,Low pH Trigger,Low TDS Trigger,pH,Solution Temperature,Surrounding Humidity,Surrounding Temperature,TDS\n';

    // Get all parameter keys from the data
    const parameters = Object.keys(data);

    // Assuming all parameters have the same length of data array
    const numRecords = data[parameters[0]].length;

    for (let i = 0; i < numRecords; i++) {
      const row = [];

      // Get the timestamp from the first parameter (assuming all have the same timestamp)
      const timestamp = data[parameters[0]][i].timestamp;
      row.push(timestamp);

      // Iterate through each parameter
      parameters.forEach(parameter => {
        const value = data[parameter][i] ? data[parameter][i].value : ''; // Get value or empty string
        row.push(value);
      });

      // Join the row data and add to CSV
      csv += row.join(',') + '\n';
    }

    return csv;
  };

  if (loading) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={containerStyle}>
      <View ref={reportRef} style={{paddingBottom: 120}}>
        <Header navigation={navigation} />
        <View style={headerContainerStyle}>
          <Text style={headerStyle}>Data and Insight</Text>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              onPress={() => {
                if (selectedSector) {
                  fetchData(selectedInterval, selectedSector);
                  fetchAnomaliesData(selectedInterval, selectedSector);
                }
              }}
              style={{marginRight: 10}}>
              <Icon name="refresh" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{marginRight: 10}}>
              <Icon name="download" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <Picker
            selectedValue={selectedSector}
            onValueChange={itemValue => setSelectedSector(itemValue)}
            style={pickerStyle}>
            {sectorList.map((sector, index) => (
              <Picker.Item
                key={index}
                label={`Sector ${index + 1}`}
                value={sector}
              />
            ))}
          </Picker>
          <Picker
            selectedValue={selectedInterval}
            onValueChange={itemValue => setSelectedInterval(itemValue)}
            style={pickerStyle}>
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Monthly" value="monthly" />
          </Picker>
        </View>
        {selectedInterval === 'daily' && (
          <Picker
            selectedValue={date.getDate()}
            onValueChange={itemValue => {
              setDate(new Date(date.getFullYear(), date.getMonth(), itemValue));
              fetchData('daily', selectedSector);
              fetchAnomaliesData('daily', selectedSector);
            }}
            style={pickerStyle}>
            {Array.from({length: 31}, (_, i) => i + 1).map(day => (
              <Picker.Item key={day} label={`Day: ${day}`} value={day} />
            ))}
          </Picker>
        )}
        {selectedInterval === 'monthly' && (
          <Picker
            selectedValue={month}
            onValueChange={itemValue => {
              setMonth(itemValue);
              fetchData('monthly', selectedSector);
              fetchAnomaliesData('monthly', selectedSector);
            }}
            style={pickerStyle}>
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <Picker.Item key={m} label={`Month: ${m}`} value={m} />
            ))}
          </Picker>
        )}
        {data[selectedParameter] ? (
          <View style={sectionBoxStyle}>
            <Text style={sectionHeaderStyle}>Select Parameter</Text>
            <Picker
              selectedValue={selectedParameter}
              onValueChange={itemValue => setSelectedParameter(itemValue)}
              style={{
                height: 50,
                width: 300,
                marginBottom: 15,
                marginHorizontal: 10,
                backgroundColor: 'white',
              }}>
              {parameterList.map((parameter, index) => (
                <Picker.Item
                  key={index}
                  label={parameterNameMap[parameter] || parameter}
                  value={parameter}
                />
              ))}
            </Picker>
            <Text style={sectionHeaderStyle}>Parameter Trend</Text>
            <ScrollView horizontal>
              <LineChart
                data={{
                  labels: handleChartOverflow(
                    processDataForChart(
                      data[selectedParameter],
                      selectedInterval,
                    ).labels,
                  ),
                  datasets: [
                    {
                      data: processDataForChart(
                        data[selectedParameter],
                        selectedInterval,
                      ).actualData,
                      color: () => 'rgba(76, 175, 80, 1)', // Green for actual data
                    },
                    {
                      data: processDataForChart(
                        data[selectedParameter],
                        selectedInterval,
                      ).predictionData,
                      color: () => '#4162ad',
                    },
                    {
                      data: processDataForChart(
                        data[selectedParameter],
                        selectedInterval,
                      ).anomalyData,
                      color: () => 'rgba(255, 0, 0, 1)',
                      withDots: true, // Enable dots for anomaly points
                      strokeWidth: 0,
                      propsForDots: {
                        r: '6',
                        strokeWidth: '2',
                        stroke: '#ffa726',
                      },
                    },
                  ],
                  legend: ['Actual Data', 'Predicted Data', 'Anomaly Points'], // Add legend
                }}
                width={800} // Adjust width as needed
                height={320}
                chartConfig={chartConfig}
                style={{marginVertical: 8}}
              />
            </ScrollView>
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              {['Mean', 'Max', 'Min'].map((item, index) => (
                <View key={index} style={statsItemStyle}>
                  <Text style={statsItemTitleStyle}>{item}</Text>
                  <Text style={textStyle}>
                    {calculateStats(data[selectedParameter])[item]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.sectionBox}>
            <Text style={sectionHeaderStyle}>Select Parameter</Text>
            <Text>No parameter data available</Text>
          </View>
        )}
        <View style={styles.sectionBox}>
          <Text style={sectionHeaderStyle}>Anomalies</Text>
          {anomalyData.length > 0 ? (
            <View>
              {anomalyData.map((anomaly, index) => (
                <View key={index} style={styles.anomalyCard}>
                  <Text style={styles.summaryHeader}>
                    Anomaly Detected at:{' '}
                  </Text>
                  <Text>
                    {anomaly.createdAt.split('+')[0].replace('T', ' ')}
                  </Text>
                  <Text style={styles.anomalyDetail}>
                    Loss: {anomaly.anomaliesSummary.loss}
                  </Text>
                  <Text style={styles.anomalyDetail}>
                    Threshold: {anomaly.anomaliesSummary.threshold}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text>No anomalies detected</Text>
          )}
        </View>
        <DatePicker
          modal
          open={showDatePicker}
          date={date}
          mode="date"
          onConfirm={selectedDate => {
            setDate(selectedDate);
            setShowDatePicker(false);
            exportData(); // Execute exportData when date is confirmed
          }}
          onCancel={() => {
            setShowDatePicker(false);
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionBox: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  anomalyCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  timestamp: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detected: {
    fontSize: 16,
    marginBottom: 10,
  },
  summaryHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  detailsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  anomalyDetail: {
    color: 'black',
    fontSize: 14,
  },
});

export default ReportScreen;
