import React, { createContext, useState, useContext, useReducer } from 'react';

// Initial state for transfers
const initialTransferState = {
  sourceAccount: null,
  destinationAccount: null,
  amount: 0,
  transferType: null,
  accounts: [],
  recentTransfers: [],
  transferFee: 0,
  transferLimits: {
    daily: 5000,
    monthly: 25000
  },
  transferStatus: null,
  errorMessage: null
};

// Action types
const TRANSFER_ACTIONS = {
  SET_SOURCE_ACCOUNT: 'SET_SOURCE_ACCOUNT',
  SET_DESTINATION_ACCOUNT: 'SET_DESTINATION_ACCOUNT',
  SET_AMOUNT: 'SET_AMOUNT',
  SET_TRANSFER_TYPE: 'SET_TRANSFER_TYPE',
  LOAD_ACCOUNTS: 'LOAD_ACCOUNTS',
  ADD_RECENT_TRANSFER: 'ADD_RECENT_TRANSFER',
  CALCULATE_TRANSFER_FEE: 'CALCULATE_TRANSFER_FEE',
  SET_TRANSFER_STATUS: 'SET_TRANSFER_STATUS',
  RESET_TRANSFER: 'RESET_TRANSFER'
};

// Reducer function
const transferReducer = (state, action) => {
  switch (action.type) {
    case TRANSFER_ACTIONS.SET_SOURCE_ACCOUNT:
      return { ...state, sourceAccount: action.payload };
    case TRANSFER_ACTIONS.SET_DESTINATION_ACCOUNT:
      return { ...state, destinationAccount: action.payload };
    case TRANSFER_ACTIONS.SET_AMOUNT:
      return { ...state, amount: action.payload };
    case TRANSFER_ACTIONS.SET_TRANSFER_TYPE:
      return { ...state, transferType: action.payload };
    case TRANSFER_ACTIONS.LOAD_ACCOUNTS:
      return { ...state, accounts: action.payload };
    case TRANSFER_ACTIONS.ADD_RECENT_TRANSFER:
      return { 
        ...state, 
        recentTransfers: [action.payload, ...state.recentTransfers].slice(0, 5) 
      };
    case TRANSFER_ACTIONS.CALCULATE_TRANSFER_FEE:
      return { 
        ...state, 
        transferFee: action.payload 
      };
    case TRANSFER_ACTIONS.SET_TRANSFER_STATUS:
      return { 
        ...state, 
        transferStatus: action.payload.status,
        errorMessage: action.payload.errorMessage 
      };
    case TRANSFER_ACTIONS.RESET_TRANSFER:
      return { 
        ...initialTransferState, 
        accounts: state.accounts 
      };
    default:
      return state;
  }
};

// Create the TransferContext
const TransferContext = createContext();

// Provider component
export const TransferProvider = ({ children }) => {
  const [state, dispatch] = useReducer(transferReducer, initialTransferState);

  // Action creators
  const actions = {
    setSourceAccount: (account) => {
      dispatch({ 
        type: TRANSFER_ACTIONS.SET_SOURCE_ACCOUNT, 
        payload: account 
      });
    },
    setDestinationAccount: (account) => {
      dispatch({ 
        type: TRANSFER_ACTIONS.SET_DESTINATION_ACCOUNT, 
        payload: account 
      });
    },
    setAmount: (amount) => {
      dispatch({ 
        type: TRANSFER_ACTIONS.SET_AMOUNT, 
        payload: amount 
      });
    },
    setTransferType: (type) => {
      dispatch({ 
        type: TRANSFER_ACTIONS.SET_TRANSFER_TYPE, 
        payload: type 
      });
    },
    loadAccounts: async () => {
      try {
        // Simulate fetching accounts - replace with actual API call
        const accounts = [
          { id: '1', name: 'Checking', balance: 5000 },
          { id: '2', name: 'Savings', balance: 10000 },
          { id: '3', name: 'Money Market', balance: 25000 }
        ];
        dispatch({ 
          type: TRANSFER_ACTIONS.LOAD_ACCOUNTS, 
          payload: accounts 
        });
      } catch (error) {
        dispatch({
          type: TRANSFER_ACTIONS.SET_TRANSFER_STATUS,
          payload: { 
            status: 'ERROR', 
            errorMessage: 'Failed to load accounts' 
          }
        });
      }
    },
    calculateTransferFee: (amount, sourceAccount, destinationAccount) => {
      // Example fee calculation logic
      let fee = 0;
      if (amount > 1000 && sourceAccount.type !== destinationAccount.type) {
        fee = 5;
      }
      dispatch({ 
        type: TRANSFER_ACTIONS.CALCULATE_TRANSFER_FEE, 
        payload: fee 
      });
      return fee;
    },
    performTransfer: async () => {
      const { sourceAccount, destinationAccount, amount } = state;
      
      try {
        // Simulate transfer - replace with actual API call
        if (amount > sourceAccount.balance) {
          throw new Error('Insufficient funds');
        }

        // Mock successful transfer
        dispatch({
          type: TRANSFER_ACTIONS.SET_TRANSFER_STATUS,
          payload: { 
            status: 'SUCCESS', 
            errorMessage: null 
          }
        });

        // Add to recent transfers
        dispatch({
          type: TRANSFER_ACTIONS.ADD_RECENT_TRANSFER,
          payload: {
            from: sourceAccount.name,
            to: destinationAccount.name,
            amount: amount,
            date: new Date()
          }
        });

        return true;
      } catch (error) {
        dispatch({
          type: TRANSFER_ACTIONS.SET_TRANSFER_STATUS,
          payload: { 
            status: 'ERROR', 
            errorMessage: error.message 
          }
        });
        return false;
      }
    },
    resetTransfer: () => {
      dispatch({ type: TRANSFER_ACTIONS.RESET_TRANSFER });
    }
  };

  return (
    <TransferContext.Provider value={{ state, actions }}>
      {children}
    </TransferContext.Provider>
  );
};

// Custom hook for using the TransferContext
export const useTransferContext = () => {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error('useTransferContext must be used within a TransferProvider');
  }
  return context;
};

export default TransferContext;