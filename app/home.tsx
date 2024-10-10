import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, DrawerLayoutAndroid, Image, Dimensions, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';  
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Profile from './users/profile';
import ListOfUsers from './users/list-of-users';

const { width: screenWidth } = Dimensions.get('window');  

export default function Dashboard() {
  const router = useRouter();
  const [drawer, setDrawer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUserSubMenu, setShowUserSubMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); 

  async function handleLogout() {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Logout token:', token);

      if (token) {
        const response = await axios.post('http://dts.sanjuancity.gov.ph/api/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        });

        console.log('Response status', response.status);
        console.log('Response headers', response.config.headers);

        await AsyncStorage.removeItem('authToken');
        router.replace('/');
      } else {
        Alert.alert('Error', 'No authentication token found.');
      }
    } catch (error) {
      console.log('Logout error:', error);
      if (error.response) {
        console.log('API error:', error.response.data);
        Alert.alert('Logout Failed', error.response.data.message || 'An error occurred during logout.');
      } else {
        Alert.alert('Logout Failed', 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>RELEASED</Text>
              <Text style={styles.cardCount}>14</Text>
              <Text style={styles.cardSubtitle}>Last Updated</Text>
            </View>
            <View style={[styles.iconBackground, { backgroundColor: '#FD3A4A' }]}>
              <MaterialCommunityIcons name="folder" size={40} color="#fff" />
            </View>
          </View>

    
          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>FOR RELEASE</Text>
              <Text style={styles.cardCount}>1</Text>
              <Text style={styles.cardSubtitle}>Last Updated</Text>
            </View>
            <View style={[styles.iconBackground, { backgroundColor: '#FFA726' }]}>
              <MaterialCommunityIcons
                name="cloud-upload"
                size={40}
                color="#fff"
              />
            </View>
          </View>


          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>INCOMING</Text>
              <Text style={styles.cardCount}>7</Text>
              <Text style={styles.cardSubtitle}>Last Updated</Text>
            </View>
            <View style={[styles.iconBackground, { backgroundColor: '#43A047' }]}>
              <MaterialCommunityIcons
                name="inbox-arrow-down"
                size={40}
                color="#fff"
              />
            </View>
          </View>

          
          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>RECEIVED</Text>
              <Text style={styles.cardCount}>15</Text>
              <Text style={styles.cardSubtitle}>Last Updated</Text>
            </View>
            <View style={[styles.iconBackground, { backgroundColor: '#1E88E5' }]}>
              <MaterialCommunityIcons name="inbox" size={40} color="#fff" />
            </View>
          </View>

         
          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>TERMINAL</Text>
              <Text style={styles.cardCount}>6</Text>
              <Text style={styles.cardSubtitle}>Last Updated</Text>
            </View>
            <View style={[styles.iconBackground, { backgroundColor: '#923CB5' }]}>
              <MaterialCommunityIcons
                name="check-bold"
                size={40}
                color="#fff"
              />
            </View>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>DRAFTS</Text>
              <Text style={styles.cardCount}>15</Text>
              <Text style={styles.cardSubtitle}>Last Updated</Text>
            </View>
            <View style={[styles.iconBackground, { backgroundColor: '#FD3A4A' }]}>
              <MaterialCommunityIcons name="file-outline" size={40} color="#fff" />
            </View>
          </View>

          </ScrollView>
        );
      case 'profile':
        return <Profile/>
      
      case 'settings':
        return (
          <View style={styles.centered}>
            <Text style={styles.text}>Settings Screen</Text>
          </View>
        );

      case 'list-of-users':
        return <ListOfUsers/>
      default:
        return null;
    }
  };

  const renderBottomNavBar = () => (
    <View style={styles.bottomNavBar}>
      <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={styles.navBarItem}>
        <MaterialCommunityIcons name="home" size={30} color={activeTab === 'dashboard' ? '#FFD700' : '#000'} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab('profile')} style={styles.navBarItem}>
        <MaterialCommunityIcons name="account" size={30} color={activeTab === 'profile' ? '#FFD700' : '#000'} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab('settings')} style={styles.navBarItem}>
        <MaterialCommunityIcons name="file-cog" size={30} color={activeTab === 'settings' ? '#FFD700' : '#000'} />
      </TouchableOpacity>
    </View>
  );

  const navigationView = () => (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/DTS.png')}
          style={styles.logoImage}
        />
      </View>
    
      <View style={styles.menuItems}>
        <TouchableOpacity style={styles.menuItem}  onPress={()=> {
          setActiveTab('dashboard')
          drawer.closeDrawer(); 
        }}>
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons name="view-dashboard" size={20} color="#000080" />
            <Text style={styles.menuText}>Dashboard</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} >
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons name="folder" size={20} color="#228B22" />
            <Text style={styles.menuText}>Documents</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#FF4500" />
            <Text style={styles.menuText}>Pending for Release</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons name="inbox-arrow-down" size={20} color="#B22222" />
            <Text style={styles.menuText}>Incoming Documents</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons name="check-box-outline" size={20} color="#FF8C00" />
            <Text style={styles.menuText}>Tagged as Terminal</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() =>{
          setActiveTab('profile');
          drawer.closeDrawer(); 
        }}>
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons name="account" size={20} color="#1E90FF" />
            <Text style={styles.menuText}>My Profile</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowUserSubMenu(!showUserSubMenu)}>
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons name="account-multiple-plus" size={20} color="#1E90FF" />
            <Text style={styles.menuText}>List / Register User</Text>
          </View>
          <MaterialCommunityIcons name={showUserSubMenu ? "chevron-up" : "chevron-down"} size={20} color="#fff" />
        </TouchableOpacity>

        {showUserSubMenu && (
          <View style={styles.subMenu}>
            <TouchableOpacity style={styles.subMenuItem} onPress={() =>{
              setActiveTab('list-of-users');
              drawer.closeDrawer(); 
            }}>
              <Text style={styles.subMenuText}>List of Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subMenuItem} onPress={() => router.push('/')}>
              <Text style={styles.subMenuText}>Register User</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons name="qrcode" size={20} color="#FF6347" />
            <Text style={styles.menuText}>QR Manager</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </View>

  );

  return (
    <DrawerLayoutAndroid
      ref={(drawer) => setDrawer(drawer)}
      drawerWidth={250}
      drawerPosition="left"
      renderNavigationView={navigationView}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => drawer.openDrawer()}>
            <MaterialCommunityIcons name="menu" size={36} color="#fff" />
          </TouchableOpacity>

          <View style={styles.navbarImages}>
            <Image
              source={require("../assets/images/bagong-pilipinas.png")}
              style={styles.navbarImage}
            />
            <Image
              source={require("../assets/images/sjc.png")}
              style={styles.navbarImage}
            />
          </View>
        </View>

        {/* <ImageBackground
          source={require('../assets/images/sjc.png')} 
          style={styles.backgroundImage}
          imageStyle={{ opacity: 0.2 }}
        >
          {renderContent()}
        </ImageBackground> */}

        {renderContent()}
        {renderBottomNavBar()}
      </View>
    </DrawerLayoutAndroid>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  navbarImages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navbarImage: {
    width: 50,
    height: 50,
    marginLeft: 10,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  scrollViewContent: {
    width: '100%',
    padding: 10,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  cardCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  iconBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  navBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidebar: {
    flex: 1,
    padding: 20,
    backgroundColor: '#2E3B55',
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 150,
    height: 50,
    resizeMode: 'contain',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  subMenu: {
    paddingLeft: 30,
    marginBottom: 10,
  },
  subMenuItem: {
    marginBottom: 10,
  },
  subMenuText: {
    color: '#fff',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#D9534F',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
});
