import React from 'react';
import {View, Text} from 'react-native';
import {css} from '@emotion/native';

const EventCard = ({day, title, description}) => {
  const cardStyle = css`
    background-color: #d3e8d5;
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 5px;
    elevation: 2;
  `;

  const titleStyle = css`
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
  `;

  const descriptionStyle = css`
    font-size: 14px;
  `;

  return (
    <View style={cardStyle}>
      <Text style={titleStyle}>{day}</Text>
      <Text style={titleStyle}>{title}</Text>
      <Text style={descriptionStyle}>{description}</Text>
    </View>
  );
};

export default EventCard;
