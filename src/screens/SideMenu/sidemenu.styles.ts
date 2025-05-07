import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row', // Changed to row-reverse to place sideMenu on the right
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent backdrop
  },
  sideMenu: {
    width: 250,
    backgroundColor: 'rgba(30, 30, 30, 0.9)', // Dark background with slight transparency
    paddingTop: 50,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(224, 224, 224, 0.2)',
    borderRightWidth: 0, // Border on the left side since menu slides from right
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  userIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
  },
  profileIcon: {
    // No additional styles needed; handled by Icon component
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 224, 224, 0.2)',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
});