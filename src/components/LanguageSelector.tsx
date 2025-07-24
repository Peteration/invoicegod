import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/solid';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, availableLanguages } = useLanguage();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50 focus:outline-none">
          {availableLanguages.find(l => l.code === language)?.name}
          <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {availableLanguages.map((lang) => (
              <Menu.Item key={lang.code}>
                {({ active }) => (
                  <button
                    onClick={() => setLanguage(lang.code)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } group flex items-center w-full px-4 py-2 text-sm`}
                  >
                    {language === lang.code ? (
                      <CheckIcon className="w-5 h-5 mr-2 text-indigo-600" />
                    ) : (
                      <span className="w-5 h-5 mr-2" />
                    )}
                    {lang.name}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};