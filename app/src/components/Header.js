import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {css} from '@emotion/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const containerStyle = css`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 10px;
  background-color: #d3e8d3;
`;

const iconStyle = css`
  margin-right: 5px;
`;

const Header = ({navigation}) => {
  return (
    <View style={containerStyle}>
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile')}>
        <Icon name="person" size={30} color="#000" style={iconStyle} />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
