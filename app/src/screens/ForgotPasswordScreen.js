import React from 'react';
import {Alert, View, Image} from 'react-native';
import {TextInput, Button, Text} from 'react-native-paper';
import {css} from '@emotion/native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {getAuth, sendPasswordResetEmail} from '@react-native-firebase/auth';
import PROFILE_IMAGE from '../assets/images/profile.png';
import axios from 'axios';
import {API_URL} from '@env';

const containerStyle = css`
  flex: 1;
  justify-content: center;
  padding: 20px;
  background-color: #d3e8d3;
`;

const avatarStyle = css`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: #ccc;
  margin-bottom: 50px;
  align-self: center;
`;

const auth = getAuth();

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPasswordScreen = ({navigation}) => {
  const handleForgotPassword = async values => {
    try {
      // Check if the email is registered
      const response = await axios.post(`${API_URL}/user/checkEmail`, {
        email: values.email,
      });

      if (response.data.exists) {
        await sendPasswordResetEmail(auth, values.email);
        Alert.alert(
          'Password Reset',
          'Password reset email sent. Check your inbox.',
        );
        navigation.navigate('Login');
      } else {
        Alert.alert(
          'Error',
          'Email is not registered. Please check your email and try again.',
        );
      }
    } catch (error) {
      console.log('Error: ', error);
      Alert.alert(
        'Error',
        'Failed to send password reset email. Please check your email and try again.',
      );
    }
  };

  return (
    <View style={containerStyle}>
      <Image source={PROFILE_IMAGE} style={avatarStyle} />
      <Formik
        initialValues={{email: ''}}
        validationSchema={ForgotPasswordSchema}
        onSubmit={handleForgotPassword}>
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View>
            <TextInput
              label="Email"
              mode="outlined"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              error={touched.email && !!errors.email}
            />
            {touched.email && errors.email && (
              <Text style={{color: 'red'}}>{errors.email}</Text>
            )}
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={{marginTop: 20}}>
              Send Reset Email
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={{marginTop: 10}}>
              Back to Login
            </Button>
          </View>
        )}
      </Formik>
    </View>
  );
};

export default ForgotPasswordScreen;
