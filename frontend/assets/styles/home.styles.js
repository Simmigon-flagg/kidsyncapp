import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  contactCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#ccc',
  },
  mainInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoBlock: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},
modalContent: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 20,
  width: '90%',
  maxWidth: 400,
},
input: {
  height: 48,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  paddingHorizontal: 12,
  marginVertical: 8,
  fontSize: 16,
  color: '#333',
  backgroundColor: '#fff',
},
header: {
  paddingVertical: 24,
  paddingHorizontal: 16,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f8f8f8',
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
},

headerTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#1a1a1a',
  marginBottom: 4,
},

headerSubtitle: {
  fontSize: 14,
  color: '#666',
  textAlign: 'center',
  maxWidth: 280,
},
emptyContentContainer: {
  flexGrow: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
emptyContainer: {
  alignItems: 'center',
},
emptyText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#666',
  marginTop: 16,
},
emptySubtext: {
  fontSize: 14,
  color: '#999',
  marginTop: 8,
},


});
