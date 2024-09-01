import React from 'react';
import {TouchableOpacity} from 'react-native';
import {css} from '@emotion/native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const buttonStyle = css`
  align-self: flex-start;
`;

const BackButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={buttonStyle} onPress={() => navigation.goBack()}>
      <Icon name="arrow-back" size={30} color="#000" />
    </TouchableOpacity>
  );
};

export default BackButton;
