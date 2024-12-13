import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router'; 
import AddDocumentModal from './add_documents'

export default function MyDocuments() {
  const router = useRouter(); 

  const [fontsLoaded] = useFonts({
    'OpenSans-Regular': require('../../assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-Bold': require('../../assets/fonts/OpenSans-Bold.ttf'),
    'Lato-Bold': require('../../assets/fonts/Lato-Bold.ttf'), 
  });

  // State variables
  const [screenWidth, setScreenWidth] = useState<number>(Dimensions.get('window').width);
  const [documents, setDocuments] = useState<any[]>([]); // You can define a proper interface for documents
  const [loading, setLoading] = useState<boolean>(true); 
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null); // Define proper type
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]); // Define proper type

  const [warningModalVisible, setWarningModalVisible] = useState<boolean>(false);

  // New state variables for custom modals
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState<boolean>(false);
  const [successDeleteModalVisible, setSuccessDeleteModalVisible] = useState<boolean>(false);

  // New state for AddDocumentModal
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);

  const documentsPerPage = 10; 
  const [currentPage, setCurrentPage] = useState<number>(1);
  const CELL_WIDTH = 180;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found.');
      }

      const response = await axios.get('http://dts.sanjuancity.gov.ph/api/my-documents-list', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
          "Content-Type": 'application/json'
        },
      });

      const fetchedData = response.data.data;
      if (Array.isArray(fetchedData)) {
        setDocuments(fetchedData);
      } else {
        throw new Error('Unexpected data format from API.');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setFetchError('An error occurred while fetching documents.');
    } finally {
      setLoading(false);
    }
  };

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter documents based on search
  const filteredDocuments = documents.filter((doc) => {
    const searchTerm = search.toLowerCase();
    return (
      doc.id.toString().toLowerCase().includes(searchTerm) ||
      (doc.doc_title || '').toLowerCase().includes(searchTerm) ||
      (doc.tracking_number || '').toLowerCase().includes(searchTerm) ||
      (doc.originating_office || '').toLowerCase().includes(searchTerm) ||
      (doc.latest_transaction || '').toLowerCase().includes(searchTerm) ||
      (doc.status !== undefined && doc.status.toString().toLowerCase().includes(searchTerm))
    );
  });

  // Sort documents based on selected field and order
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField] ? a[sortField].toString().toLowerCase() : '';
    const bValue = b[sortField] ? b[sortField].toString().toLowerCase() : '';

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    } else if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    } else {
      return 0;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedDocuments.length / documentsPerPage);
  const indexOfLastDoc = currentPage * documentsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - documentsPerPage;
  const currentDocuments = sortedDocuments.slice(indexOfFirstDoc, indexOfLastDoc);

  // Handle row selection
  const handleRowPress = (id: number) => {
    setSelectedDocumentId(id === selectedDocumentId ? null : id);
  };

  // Render each document row
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => handleRowPress(item.id)} 
      style={[
        styles.row, 
        { minWidth: CELL_WIDTH * 6 },
        selectedDocumentId === item.id && styles.selectedRow
      ]}
    >
      <Text style={[styles.cell, { width: CELL_WIDTH }]}>{item.id}</Text>
      <Text style={[styles.cell, { width: CELL_WIDTH }]}>{item.doc_title}</Text>
      <Text style={[styles.cell, { width: CELL_WIDTH }]}>{item.tracking_number}</Text>
      <Text style={[styles.cell, { width: CELL_WIDTH }]}>{item.originating_office}</Text>
      <Text style={[styles.cell, { width: CELL_WIDTH }]}>{item.latest_transaction}</Text>
      <Text style={[styles.cell, { width: CELL_WIDTH }]}>{item.status}</Text>
    </TouchableOpacity>
  );

  // Handle pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Generate pagination numbers with ellipsis
  const generatePageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const totalNumbers = 5;
    const halfTotal = Math.floor(totalNumbers / 2);

    let startPage = Math.max(2, currentPage - halfTotal);
    let endPage = Math.min(totalPages - 1, currentPage + halfTotal);

    if (currentPage <= halfTotal) {
      endPage = totalNumbers;
    }

    if (currentPage + halfTotal >= totalPages) {
      startPage = totalPages - totalNumbers + 1;
    }

    startPage = Math.max(startPage, 2);
    endPage = Math.min(endPage, totalPages - 1);

    pageNumbers.push(1);

    if (startPage > 2) {
      pageNumbers.push('left-ellipsis');
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        pageNumbers.push(i);
      }
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push('right-ellipsis');
    }

    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  // Loading and error states
  if (!fontsLoaded) {
    return <AppLoading />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A52A2A" />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red', marginBottom: 10 }}>{fetchError}</Text>
        <TouchableOpacity onPress={fetchDocuments} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSearching = search.length > 0;

  
  const renderSortIcon = (field: string) => {
    if (sortField === field) {
      return sortOrder === 'asc' ? 
        <AntDesign name="arrowup" size={14} color="#fff" /> : 
        <AntDesign name="arrowdown" size={14} color="#fff" />;
    }
    return null;
  };

  
  const handleViewDocument = async () => {
    if (!selectedDocumentId) {
      setWarningModalVisible(true);
      return;
    }

    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) throw new Error('No authorization token found.');

      const response = await axios.get(`http://dts.sanjuancity.gov.ph/api/my-docs-view/${selectedDocumentId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const docData = response.data.data;

      const attachedResponse = await axios.get(`http://dts.sanjuancity.gov.ph/api/attached-files/${selectedDocumentId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Accept": 'application/json',
          "Content-Type": 'application/json', 
        },
      });

      const filesData = attachedResponse.data.data || [];

      setSelectedDocument(docData);
      setAttachedFiles(filesData);
      setModalVisible(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      Alert.alert('Error', 'An error occurred while viewing the document.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleDeleteDocument = () => {
    if (!selectedDocumentId) {
      setWarningModalVisible(true);
      return;
    }

    setConfirmDeleteModalVisible(true);
  };

  const confirmDeleteDocument = async () => {
    setConfirmDeleteModalVisible(false);
    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) throw new Error('No authorization token found.');

      const response = await axios.delete(`http://dts.sanjuancity.gov.ph/api/delete-doc/${selectedDocumentId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
          "Content-Type": 'application/json'
        },
      });

      console.log(response.status);

      if (response.status === 200) {
        setSuccessDeleteModalVisible(true);
        fetchDocuments();
        setSelectedDocumentId(null);
      } else {
        throw new Error('Failed to delete the document.');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      Alert.alert('Error', 'An error occurred while deleting the document.');
    } finally {
      setLoading(false);
    }
  };


  const handleEditDocument = () => {
    if (!selectedDocumentId) {
      setWarningModalVisible(true);
      return;
    }
    // Implement edit functionality or navigation
    // Example: router.push(`/documents/edit_documents/${selectedDocumentId}`);
    // For now, just logging
    console.log('Edit Document Pressed');
    Alert.alert('Edit', 'Edit Document functionality is not implemented yet.');
  };

  // Handle tracking a document
  const handleTrackDocument = () => {
    if (!selectedDocumentId) {
      setWarningModalVisible(true);
      return;
    }
    // Implement track functionality or navigation
    // Example: router.push(`/documents/track_documents/${selectedDocumentId}`);
    // For now, just logging
    console.log('Track Document Pressed');
    Alert.alert('Track', 'Track Document functionality is not implemented yet.');
  };

  // Close modals
  const closeModal = () => {
    setModalVisible(false);
    setSelectedDocument(null);
    setAttachedFiles([]);
  };

  const closeWarningModal = () => {
    setWarningModalVisible(false);
  };

  const closeSuccessDeleteModal = () => {
    setSuccessDeleteModalVisible(false);
  };

  // Handle opening and closing Add Document Modal
  const openAddModal = () => {
    setIsAddModalVisible(true);
  };

  const closeAddModal = () => {
    setIsAddModalVisible(false);
  };

  // Handle successful addition
  const handleAddSuccess = () => {
    fetchDocuments(); // Refresh the documents list
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>My Documents</Text>

      {/* Search */}
      <View style={[styles.searchContainer, isSearching && styles.searchContainerActive]}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          placeholder="Search..."
          placeholderTextColor="#8E8E93"
          style={[styles.searchInput, isSearching && styles.searchInputActive]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsGridContainer}>
        <TouchableOpacity style={[styles.button, styles.addButton]} onPress={openAddModal}>
          <MaterialIcons name="add-box" size={24} color="#fff" />
          <Text style={styles.buttonText}>Add Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEditDocument}>
          <MaterialIcons name="edit" size={24} color="#fff" />
          <Text style={styles.buttonText}>Edit Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.viewButton]} onPress={handleViewDocument}>
          <MaterialIcons name="visibility" size={24} color="#fff" />
          <Text style={styles.buttonText}>View Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.trackButton]} onPress={handleTrackDocument}>
          <MaterialIcons name="track-changes" size={24} color="#fff" />
          <Text style={styles.buttonText}>Track Document</Text>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView horizontal style={{ marginBottom: 16 }}>
        <View style={styles.cardContainer}>
          <View style={[styles.row, styles.tableHeader, { minWidth: CELL_WIDTH * 6 }]}>
            <TouchableOpacity 
              onPress={() => handleSort('id')} 
              style={[styles.headerCell, { width: CELL_WIDTH, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={[styles.tableHeaderText]}>ID</Text>
              {renderSortIcon('id')}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => handleSort('doc_title')} 
              style={[styles.headerCell, { width: CELL_WIDTH, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={styles.tableHeaderText}>Document Title</Text>
              {renderSortIcon('doc_title')}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleSort('tracking_number')} 
              style={[styles.headerCell, { width: CELL_WIDTH, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={styles.tableHeaderText}>Tracking No.</Text>
              {renderSortIcon('tracking_number')}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleSort('originating_office')} 
              style={[styles.headerCell, { width: CELL_WIDTH, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={styles.tableHeaderText}>Originating Office</Text>
              {renderSortIcon('originating_office')}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleSort('latest_transaction')} 
              style={[styles.headerCell, { width: CELL_WIDTH, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={styles.tableHeaderText}>Last Transaction</Text>
              {renderSortIcon('latest_transaction')}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleSort('status')} 
              style={[styles.headerCell, { width: CELL_WIDTH, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={styles.tableHeaderText}>Status</Text>
              {renderSortIcon('status')}
            </TouchableOpacity>
          </View>

          {currentDocuments.length === 0 ? (
            <View style={{ padding: 20 }}>
              <Text style={{ textAlign: 'center', color: '#333' }}>No data found.</Text>
            </View>
          ) : (
            <FlatList
              data={currentDocuments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
            />
          )}
        </View>
      </ScrollView>

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={handlePreviousPage}
          style={styles.paginationButton}
        >
          <AntDesign
            name="left"
            size={20}
            color={currentPage === 1 ? '#ccc' : '#2A47CB'}
          />
        </TouchableOpacity>

        <View style={styles.pageNumbersContainer}>
          {pageNumbers.map((number, index) => {
            if (number === 'left-ellipsis' || number === 'right-ellipsis') {
              return (
                <Text key={index} style={styles.ellipsisText}>
                  ...
                </Text>
              );
            } else {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePageChange(number as number)}
                  style={[
                    styles.pageNumberButton,
                    currentPage === number && styles.currentPageButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageNumberText,
                      currentPage === number && styles.currentPageText,
                    ]}
                  >
                    {number}
                  </Text>
                </TouchableOpacity>
              );
            }
          })}
        </View>

        <TouchableOpacity
          onPress={handleNextPage}
          style={styles.paginationButton}
        >
          <AntDesign
            name="right"
            size={20}
            color={currentPage === totalPages || totalPages === 0 ? '#ccc' : '#2A47CB'}
          />
        </TouchableOpacity>
      </View>

      {/* FAB for Delete */}
      {selectedDocumentId && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleDeleteDocument}
        >
          <MaterialIcons name="delete" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Warning Modal */}
      <Modal
        visible={warningModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalContainer}>
            <MaterialIcons name="warning" size={48} color="#F44336" style={styles.warningIcon} />
            <Text style={styles.warningModalTitle}>Warning</Text>
            <Text style={styles.warningModalText}>Please select a document first to perform this action.</Text>
            <TouchableOpacity onPress={closeWarningModal} style={styles.warningCloseButton}>
              <Text style={styles.warningCloseButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Document Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedDocument ? (
              <>
                <Text style={styles.modalTitle}>{selectedDocument.tracking_number}</Text>
                <ScrollView style={{ maxHeight: 400 }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.modalLabel}>Title:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={selectedDocument.doc_title}
                      editable={false}
                      selectTextOnFocus={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modalLabel}>Document Type:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={selectedDocument.doc_type}
                      editable={false}
                      selectTextOnFocus={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modalLabel}>Document Subject:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={selectedDocument.doc_subject}
                      editable={false}
                      selectTextOnFocus={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modalLabel}>Originating Office:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={selectedDocument.originating_office}
                      editable={false}
                      selectTextOnFocus={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modalLabel}>Remarks:</Text>
                    <TextInput
                      style={[styles.modalInput, styles.multilineInput]}
                      value={selectedDocument.remarks}
                      editable={false}
                      multiline
                      numberOfLines={4}
                      selectTextOnFocus={false}
                    />
                  </View>

                  <Text style={styles.modalLabel}>Attached Files:</Text>
                  {attachedFiles && attachedFiles.length > 0 ? (
                    <View style={{ marginLeft: 10 }}>
                      {attachedFiles.map((file, idx) => {
                        const fileURL = `http://dts.sanjuancity.gov.ph/files/${file.from_office}/${file.filename}`;
                        return (
                          <TouchableOpacity key={idx} onPress={() => Linking.openURL(fileURL)}>
                            <Text style={styles.modalFileLink}>• {file.filename}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.modalValue}>No attached files</Text>
                  )}
                </ScrollView>

                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator size="large" color="#000" />
            )}
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        visible={confirmDeleteModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDeleteModalContainer}>
            <MaterialIcons name="delete-forever" size={48} color="#F44336" style={styles.confirmDeleteIcon} />
            <Text style={styles.confirmDeleteTitle}>Confirm Deletion</Text>
            <Text style={styles.confirmDeleteText}>Are you sure you want to delete this document?</Text>
            <View style={styles.confirmDeleteButtonsContainer}>
              <TouchableOpacity onPress={() => setConfirmDeleteModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteDocument} style={styles.deleteButtonModal}>
                <Text style={styles.deleteButtonModalText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Delete Modal */}
      <Modal
        visible={successDeleteModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successDeleteModalContainer}>
            <MaterialIcons name="check-circle" size={48} color="#4CAF50" style={styles.successDeleteIcon} />
            <Text style={styles.successDeleteTitle}>Success</Text>
            <Text style={styles.successDeleteText}>Document deleted successfully.</Text>
            <TouchableOpacity onPress={closeSuccessDeleteModal} style={styles.successCloseButton}>
              <Text style={styles.successCloseButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Document Modal */}
      <AddDocumentModal
        visible={isAddModalVisible}
        onClose={closeAddModal}
        onSuccess={handleAddSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#041435',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'relative', 
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'OpenSans-Bold'
  },
  actionsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16, 
  },
  searchContainerActive: {
    borderColor: '#2A47CB',
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  searchInputActive: {
  },
  
  cardContainer: {
    backgroundColor: '#fff', 
    borderRadius: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 5, 
    padding: 10, 
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableHeader: {
    backgroundColor: '#002244', 
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 13,
    fontFamily: 'OpenSans-Bold',
    marginRight: 4
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedRow: {
    backgroundColor: '#DDEAFB', 
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    textAlign: 'center',
    fontSize: 13,
    color: '#333',
    fontFamily: 'OpenSans-Regular'
  },
  headerCell: {
    paddingVertical: 9,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
   
  },
  paginationButton: {
    padding: 8,
   
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumberButton: {
    marginHorizontal: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#f1f1f1',
  },
  currentPageButton: {
    backgroundColor: '#002244',
  },
  pageNumberText: {
    color: '#2A47CB',
    fontSize: 14,
  },
  currentPageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ellipsisText: {
    fontSize: 16,
    marginHorizontal: 5,
    color: '#333',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
    fontWeight: '600',
    fontFamily: 'OpenSans-Bold'
  },
  button: {
    width: '48%', 
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    paddingHorizontal: 10,
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addButton: {
    backgroundColor: '#17B169',
  },
  editButton: {
    backgroundColor: '#770737',
  },
  viewButton: {
    backgroundColor: '#13274F',
  },
  trackButton: {
    backgroundColor: '#666666',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8, 
  },
  deleteButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
    fontFamily: 'OpenSans-Bold',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#F44336',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    right: 20,
    bottom: 20,
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 3, 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  warningIcon: {
    marginBottom: 16,
  },
  warningModalTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#F44336',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningModalText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  warningCloseButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  warningCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  modalValue: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  modalFileLink: {
    color: '#2A47CB',
    textDecorationLine: 'underline',
    marginVertical: 2,
    fontFamily: 'OpenSans-Regular',
    fontSize: 14
  },
  closeButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFF',
  },
  inputGroup: {
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
    fontFamily: 'OpenSans-Regular',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  
  confirmDeleteModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  confirmDeleteIcon: {
    marginBottom: 16,
  },
  confirmDeleteTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#F44336',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmDeleteText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmDeleteButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#B0BEC5',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
  },
  deleteButtonModal: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteButtonModalText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
  },

  successDeleteModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successDeleteIcon: {
    marginBottom: 16,
  },
  successDeleteTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
  },
  successDeleteText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  successCloseButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  successCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
  },
});
