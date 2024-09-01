import React from 'react';
import {View, Text} from 'react-native';
import {css} from '@emotion/native';
import {TouchableOpacity} from 'react-native-gesture-handler';

const cardStyle = css`
  width: 150px;
  height: 150px;
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
  padding: 5px;
  font-size: 24px;
  color: #4caf50;
`;

const ParameterCard = ({label, value}) => {
  return (
    <TouchableOpacity>
      <View style={cardStyle}>
        <Text style={textStyle}>{label}</Text>
        <Text style={valueStyle}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ParameterCard;
