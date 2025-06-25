'use client';
import React from 'react';
import { createId } from '@paralleldrive/cuid2';

import { makeAutoObservable } from 'mobx';
import { AppState } from './types';
import { SWIFTLY_ICON } from './lib/swiftlyIconBase64';

const CURRENT_STATE_VERSION = '3';

function presetInvoice(): AppState {
  return {
    identifier: createId(),
    version: CURRENT_STATE_VERSION,
    sidebarOpen: false,
    previewMode: false,
    currency: {
      name: 'United States Dollar',
      value: 'USD',
    },
    logo: null,
    businessName: 'Acme Corporation',
    businessHeaderFreeText:
      'John Smith\n123 Main St, San Francisco, CA 94110\nUnited States\njohn@johnsmith.com\n+1 (555) 123-4567',
    headerFields: [
      {
        label: 'INVOICE #',
        labelPlaceholder: 'INVOICE #',
        value: 'INV-0001',
        placeholder: 'INV-0001',
      },
      {
        label: 'DATE',
        labelPlaceholder: 'DATE',
        value: new Date().toLocaleDateString(),
        placeholder: '01/01/2021',
      },
    ],
    invoiceSubheader: 'INVOICE',
    invoiceSubheaderFreeText:
      'To: John Smith\n123 Main St, San Francisco, CA 94110\nUnited States\njohn@johnsmith.com',
    notesLabel: 'NOTES',
    notesFreeText:
      'Thank you for your business!\nPayment is due via bank transfer within 30 days.\nACH: 123456789\nWire: 987654321',
    lineItems: [
      {
        name: 'Website Design (Hours)',
        description: 'Design for Johns website, includes 3 revisions.',
        amount: 70,
      },
      {
        name: 'Website Development (Hours)',
        description: 'Wordpress development',
        amount: 75,
      },
      {
        name: 'Website Hosting (1 year)',
        description: '',
        amount: 100,
      },
    ],
  };
}

function defaultInvoice(): AppState {
  return {
    identifier: createId(),
    version: CURRENT_STATE_VERSION,
    sidebarOpen: false,
    previewMode: false,
    currency: {
      name: 'United States Dollar',
      value: 'USD',
    },
    logo: null,

    businessName: '',
    businessHeaderFreeText: '',
    headerFields: [
      {
        label: 'INVOICE #',
        labelPlaceholder: 'INVOICE #',
        value: '',
        placeholder: 'INV-0001',
      },
      {
        label: 'DATE',
        labelPlaceholder: 'DATE',
        value: new Date().toLocaleDateString(),
        placeholder: '01/01/2021',
      },
    ],
    invoiceSubheader: 'INVOICE',
    invoiceSubheaderFreeText: '',
    notesLabel: 'NOTES',
    notesFreeText: '',

    lineItems: [],
  };
}

class AppStateStore {
  state: AppState;
  showTour: boolean = true;
  forceDesktop: boolean = false;

  constructor(serverState?: AppState) {
    if (serverState) {
      this.state = this.migrateAndValidateState(serverState);
      this.showTour = false;
      this.forceDesktop = true;
    } else {
      const localState = this.loadFromLocalStorage();
      if (localState) {
        this.state = this.migrateAndValidateState(localState);
        this.showTour = false;
      } else {
        this.state = presetInvoice();
        this.showTour = true;
      }
    }

    makeAutoObservable(this);
  }

  formatAsCurrency = (value: number) => {
    return Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.state.currency.value,
    }).format(value);
  };

  saveToLocalStorage = () => {
    window.localStorage.setItem('invoice-chef', JSON.stringify(this.state));
  };

  migrateAndValidateState = (parsedState: any) => {
    try {
      if (!parsedState) {
        return presetInvoice();
      }
      
      if (parsedState.version === CURRENT_STATE_VERSION) {
        // Remove any tax-related properties if they exist
        if (parsedState.taxRate !== undefined) {
          delete parsedState.taxRate;
        }
        if (parsedState.taxEnabled !== undefined) {
          delete parsedState.taxEnabled;
        }
        
        // Clean up line items to remove quantity
        if (parsedState.lineItems && Array.isArray(parsedState.lineItems)) {
          parsedState.lineItems = parsedState.lineItems.map((item: any) => {
            const cleanItem: any = {
              name: item.name || '',
              description: item.description || '',
            };
            // Handle both old 'price' and new 'amount' properties
            const amountValue = item.amount !== undefined ? item.amount : item.price;
            if (amountValue !== undefined && !isNaN(Number(amountValue))) {
              cleanItem.amount = Number(amountValue);
            }
            return cleanItem;
          });
        }
        
        return parsedState;
      }
      
      if (Number(parsedState.version) < 3) {
        // Remove tax-related properties and update version
        if (parsedState.taxRate !== undefined) {
          delete parsedState.taxRate;
        }
        if (parsedState.taxEnabled !== undefined) {
          delete parsedState.taxEnabled;
        }
        
        // Clean up line items to remove quantity
        if (parsedState.lineItems && Array.isArray(parsedState.lineItems)) {
          parsedState.lineItems = parsedState.lineItems.map((item: any) => {
            const cleanItem: any = {
              name: item.name || '',
              description: item.description || '',
            };
            // Handle both old 'price' and new 'amount' properties
            const amountValue = item.amount !== undefined ? item.amount : item.price;
            if (amountValue !== undefined && !isNaN(Number(amountValue))) {
              cleanItem.amount = Number(amountValue);
            }
            return cleanItem;
          });
        }
        
        return {
          ...parsedState,
          version: CURRENT_STATE_VERSION,
        };
      }
      
      return parsedState;
    } catch (error) {
      console.error('Migration failed, falling back to preset invoice:', error);
      return presetInvoice();
    }
  };

  loadFromLocalStorage = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const savedState = window.localStorage.getItem('invoice-chef');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return parsedState;
    }
    return;
  };

  setState = <K extends keyof AppState>(key: K, value: AppState[K]): void => {
    this.state[key] = value;
    this.saveToLocalStorage();
  };

  newInvoice = () => {
    const previousInvoiceNumber = this.state.headerFields?.[0].value || '';
    // this may be a string but contains a number inside.
    // use a regex to extract the number part and increment it.

    const numberPart = previousInvoiceNumber.match(/\d+/)?.[0] || '';
    const numberLength = numberPart.length;

    const incrementedNumber = Number(numberPart) + 1;

    // Pad the incremented number with zeros to maintain the same number of digits.
    const paddedNumber = String(incrementedNumber).padStart(numberLength, '0');

    const newInvoiceNumber = previousInvoiceNumber.replace(
      numberPart,
      paddedNumber,
    );

    this.setState('lineItems', []);
    this.setState('headerFields', [
      {
        label: 'INVOICE #',
        labelPlaceholder: 'INVOICE #',
        value: newInvoiceNumber,
        placeholder: 'INV-0001',
      },
      {
        label: 'DATE',
        labelPlaceholder: 'DATE',
        value: new Date().toLocaleDateString(),
        placeholder: '01/01/2021',
      },
    ]);
    this.setState('invoiceSubheaderFreeText', '');
  };

  clearInvoice = () => {
    this.state = defaultInvoice();
    this.saveToLocalStorage();
  };

  fillWithPresetInvoice = () => {
    this.state = presetInvoice();
    this.saveToLocalStorage();
  };

  sendInvoice = async (email: string, token: string) => {
    const invoice = this.state;

    const response = await fetch('https://pdf.invoice-kitchen.workers.dev', {
      method: 'POST',
      body: JSON.stringify({ email, invoice, token }),
    });

    if (response.status === 200) {
      return true;
    }

    return false;
  };
}

export let store: AppStateStore | undefined = undefined;
export let StoreContext: React.Context<AppStateStore> =
  undefined as unknown as React.Context<AppStateStore>;

export const initStore = (serverState?: AppState) => {
  if (!store) {
    const _store = new AppStateStore(serverState);
    store = _store;
    StoreContext = React.createContext(_store);
  }
  return store;
};

export const useAppStateStore = () => React.useContext(StoreContext!);
