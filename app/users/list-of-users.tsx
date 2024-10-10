import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Button,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ListOfUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (pageNumber = 1, searchQuery = '') => {
    try {
      setLoading(true);

     
      const authToken = await AsyncStorage.getItem('authToken');

     
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      const response = await axios.get(
        `http://dts.sanjuancity.gov.ph/api/list-user`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`, 
          },
        }
      );

      const { users, total_pages } = response.data;
      setUsers(users);
      setTotalPages(total_pages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  useEffect(() => {
    fetchUsers(page, debouncedSearch);
  }, [page, debouncedSearch]);

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.userRow}>
      <Text style={styles.cell}>{item.id}</Text>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>{item.office_dept}</Text>
      <Text style={styles.cell}>{item.designation || 'N/A'}</Text>
      <Text style={styles.cell}>{item.username}</Text>
      <Text style={styles.cell}>{item.active === '1' ? 'Active' : 'Inactive'}</Text>
    </TouchableOpacity>
  );

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>List of Users</Text>
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit User</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name..."
        value={search}
        onChangeText={setSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#2A47CB" />
      ) : (
        <ScrollView horizontal>
          <View>
            <View style={styles.header}>
              <Text style={styles.headerCell}>ID</Text>
              <Text style={styles.headerCell}>Name</Text>
              <Text style={styles.headerCell}>Office</Text>
              <Text style={styles.headerCell}>Designation</Text>
              <Text style={styles.headerCell}>Username</Text>
              <Text style={styles.headerCell}>Status</Text>
            </View>
            {users.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No matches found.</Text>
              </View>
            ) : (
              <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={(item) => item.id.toString()}
              />
            )}
          </View>
        </ScrollView>
      )}

      <View style={styles.paginationContainer}>
        <Button title="Previous" onPress={handlePreviousPage} disabled={page === 1} />
        <Text style={styles.pageNumber}>
          Page {page} of {totalPages}
        </Text>
        <Button title="Next" onPress={handleNextPage} disabled={page === totalPages} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#2A47CB',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#2A47CB',
    paddingVertical: 10,
  },
  headerCell: {
    width: 120,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cell: {
    width: 120,
    textAlign: 'center',
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  pageNumber: {
    fontWeight: 'bold',
  },
});
