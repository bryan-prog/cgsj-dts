import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useRouter } from 'expo-router';

const MayorsPage = () => {
  const router = useRouter();

  const handleLogout = () => {
  
    router.push('/'); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to the Mayor's Page</Text>
      <Text style={styles.body}>This page is only accessible to users with the 'City Mayor' designation.</Text>
      
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  body: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default MayorsPage;
