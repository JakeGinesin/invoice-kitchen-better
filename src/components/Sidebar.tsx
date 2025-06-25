'use client';
import React from 'react';
import { Cross1Icon } from '@radix-ui/react-icons';
import { CurrencySelector } from './CurrencySelector';
import { LogoSelector } from './LogoSelector';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { useAppStateStore } from '@/store';

export function Sidebar() {
  const { state, setState } = useAppStateStore();

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
        state.sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button
          onClick={() => setState('sidebarOpen', false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Cross1Icon className="w-5 h-5" />
        </button>
      </div>
      <div className="px-4 py-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Currency</AccordionTrigger>
            <AccordionContent>
              <CurrencySelector />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Logo</AccordionTrigger>
            <AccordionContent>
              <LogoSelector />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
