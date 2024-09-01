import React from 'react';
import {useAuth} from '../utils/AuthContext';
import AuthStack from './AuthStack';
import TabNavigator from './TabNavigator';

const RootNavigation = () => {
  const {user} = useAuth();

  if (user) {
    if (user.emailVerified) {
      return <TabNavigator />;
    } else {
      return <AuthStack />;
    }
  }

  return <AuthStack />;
};

export default RootNavigation;
