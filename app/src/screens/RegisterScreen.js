import React from 'react';
import {Alert, View, Image} from 'react-native';
import {TextInput, Button, Text} from 'react-native-paper';
import {css} from '@emotion/native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
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

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

const RegisterScreen = ({navigation}) => {
  const handleRegister = async values => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      const user = userCredential.user;
      saveUser(user.uid);
      await sendEmailVerification(user);
      await signOut(auth);
      Alert.alert(
        'Registration Successful',
        'A verification email has been sent to your email address. Please verify your email before logging in.',
      );
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const saveUser = async uid => {
    const messageToken = getStoredMessageToken();
    try {
      const newUser = {
        messageToken: messageToken,
        userId: uid,
        farmList: [],
      };
      const res = await axios.post(`${API_URL}/user/register`, newUser);
      if (res.status === 200) {
        console.log('User insert Successful');
      } else {
        console.log('Failed to save user');
      }
    } catch (error) {
      console.error('Error adding farm: ', error);
    }
  };

  return (
    <View style={containerStyle}>
      <Image source={PROFILE_IMAGE} style={avatarStyle} />
      <Formik
        initialValues={{
          email: '',
          password: '',
          confirmPassword: '',
        }}
        validationSchema={RegisterSchema}
        onSubmit={handleRegister}>
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
            <TextInput
              label="Confirm Password"
              mode="outlined"
              secureTextEntry
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              value={values.confirmPassword}
              error={touched.confirmPassword && !!errors.confirmPassword}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <Text style={{color: 'red'}}>{errors.confirmPassword}</Text>
            )}
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={{marginTop: 20}}>
              Register
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

export default RegisterScreen;
