import React from 'react';
import {Alert, View, Image} from 'react-native';
import {TextInput, Button, Text} from 'react-native-paper';
import {css} from '@emotion/native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import axios from 'axios';
import {getStoredMessageToken} from '../utils/LocalMessageToken';
import PROFILE_IMAGE from '../assets/images/profile.png';
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

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const LoginScreen = ({navigation}) => {
  const handleLogin = async values => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      const user = userCredential.user;
      await checkToken(user.uid);
      if (user.emailVerified) {
        navigation.navigate('Loading');
      } else {
        await signOut(auth);
        Alert.alert(
          'Email not verified',
          'Please verify your email before logging in. Check your inbox for the verification email.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Login failed. Please check your email or password and try again.',
      );
    }
  };

  const checkToken = async userId => {
    const messageToken = await getStoredMessageToken();
    if (!messageToken) {
      console.log('No message token found');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/user/checkToken`, {
        userId,
        messageToken,
      });
      if (res.status === 200) {
        console.log('Checked token successfully');
      } else {
        console.log('Failed to check token');
      }
    } catch (error) {
      console.error('Error checking token: ', error);
    }
  };

  return (
    <View style={containerStyle}>
      <Image source={PROFILE_IMAGE} style={avatarStyle} />
      <Formik
        initialValues={{email: '', password: ''}}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}>
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
            <TextInput
              label="Password"
              mode="outlined"
              secureTextEntry
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              error={touched.password && !!errors.password}
            />
            {touched.password && errors.password && (
              <Text style={{color: 'red'}}>{errors.password}</Text>
            )}
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={{marginTop: 20}}>
              Login
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{marginTop: 5}}>
              Forgot Password
            </Button>
            <Text style={{marginTop: 20, textAlign: 'center'}}>
              Does not have an account?
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Register')}
              style={{marginTop: 10}}>
              Register
            </Button>
          </View>
        )}
      </Formik>
    </View>
  );
};

export default LoginScreen;
