import React from 'react';
import {View, Text} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {css} from '@emotion/native';
import BackButton from '../components/BackButton';

const ParameterScreen = ({route, navigation}) => {
  const containerStyle = css`
    flex: 1;
    padding: 20px;
    background-color: #d3e8d3;
  `;

  const boxContainerStyle = css`
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
  `;

  const boxStyle = css`
    width: 150px;
    height: 120px;
    align-items: center;
    padding: 20px;
    margin: 10px;
    border-radius: 10px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  `;

  const textStyle = css`
    font-size: 18px;
    font-weight: bold;
  `;

  const valueStyle = css`
    font-size: 24px;
    color: #4caf50;
  `;

  const {parameter, data} = route.params;

  const calculateStats = values => {
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = (sum / values.length).toFixed(2);
    const max = Math.max(...values).toFixed(2);
    const min = Math.min(...values).toFixed(2);
    const anomalies = values.filter(val => val < min || val > max).length;

    return {average, max, min, anomalies};
  };

  const {average, max, min, anomalies} = calculateStats(data.values);

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

  return (
    <View style={containerStyle}>
      <BackButton />
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          marginTop: 10,
        }}>
        {parameter}
      </Text>
      <View style={boxContainerStyle}>
        <View style={boxStyle}>
          <Text style={textStyle}>Average</Text>
          <Text style={valueStyle}>{average}</Text>
        </View>
        <View style={boxStyle}>
          <Text style={textStyle}>Max</Text>
          <Text style={valueStyle}>{max}</Text>
        </View>
        <View style={boxStyle}>
          <Text style={textStyle}>Min</Text>
          <Text style={valueStyle}>{min}</Text>
        </View>
        <View style={boxStyle}>
          <Text style={textStyle}>Anomalies</Text>
          <Text style={valueStyle}>{anomalies}</Text>
        </View>
        <LineChart
          data={{
            labels: data.labels,
            datasets: [{data: data.values}],
          }}
          width={360}
          height={350}
          chartConfig={chartConfig}
          style={{marginVertical: 10, borderRadius: 5}}
        />
      </View>
    </View>
  );
};

export default ParameterScreen;
