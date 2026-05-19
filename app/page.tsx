'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionObjects, setSuggestionObjects] = useState<any[]>([]);
  const [streetAddress, setStreetAddress] = useState('');
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [highlightFields, setHighlightFields] = useState<Set<string>>(new Set());
  const [postcodeError, setPostcodeError] = useState('');
  const [isApiOffline, setIsApiOffline] = useState(false);
  const [showManualFields, setShowManualFields] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const streetAddressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (isApiOffline && !showManualFields) {
      setShowManualFields(true);
    }
  }, [isApiOffline, showManualFields]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
  };

  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const handleAddressSearch = useCallback(
    debounce(async (value: string) => {
      setSearchAddress(value);
      setSearchError('');

      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/address?q=${encodeURIComponent(value)}`);
        const data = await response.json();

        if (!response.ok) {
          // Check for 500 error or network failure
          if (response.status === 500 || response.status === 0) {
            setIsApiOffline(true);
            throw new Error('API is offline');
          }
          throw new Error(data.error || 'Failed to fetch addresses');
        }

        if (data.addresses && data.addresses.length > 0) {
          setSuggestionObjects(data.addresses);
          setSuggestions(data.addresses.map((addr: any) => 
            addr.fullAddress || `${addr.street}, ${addr.suburb}, ${addr.city} ${addr.postcode}`
          ));
        } else {
          setSuggestions([]);
          setSuggestionObjects([]);
          setSearchError('No matching address found');
        }
      } catch (error) {
        setSuggestions([]);
        setSuggestionObjects([]);
        setSearchError('Unable to load addresses.');
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSelectAddress = (index: number) => {
    const addressObj = suggestionObjects[index];
    const addressString = suggestions[index];

    setSelectedAddress(addressString);
    setSearchAddress(addressString);
    setSuggestions([]);
    setSuggestionObjects([]);
    setSearchError('');

    // Populate fields from the standardized address object
    setStreetAddress(addressObj.street || '');
    setSuburb(addressObj.suburb || '');
    setCity(addressObj.city || '');
    setPostcode(addressObj.postcode || '');

    // Trigger highlight animation for auto-filled fields
    setHighlightFields(new Set(['streetAddress', 'suburb', 'city', 'postcode']));

    // Clear highlight after animation
    setTimeout(() => {
      setHighlightFields(new Set());
    }, 1000);
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  const handleFieldChange = (fieldName: string, value: string, setter: (val: string) => void) => {
    setter(value);
    // Clear touched state and errors when user starts typing
    setTouchedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
    setFormError('');
    if (fieldName === 'postcode') {
      setPostcodeError('');
    }
  };

  const handlePostcodeChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    setPostcode(numericValue);

    // Clear touched state and errors when user starts typing
    setTouchedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete('postcode');
      return newSet;
    });
    setFormError('');
    setPostcodeError('');

    // Validate postcode format
    if (numericValue.length === 4) {
      const postcodeRegex = /^\d{4}$/;
      if (!postcodeRegex.test(numericValue)) {
        setPostcodeError('Postcode must be exactly 4 digits');
      }
    }
  };

  const handleManualEntry = () => {
    setShowManualFields(true);
    setSearchError('');
    if (streetAddressRef.current) {
      streetAddressRef.current.focus();
      streetAddressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleClear = () => {
    setSearchAddress('');
    setSelectedAddress('');
    setSuggestions([]);
    setSuggestionObjects([]);
    setStreetAddress('');
    setSuburb('');
    setCity('');
    setPostcode('');
    setSearchError('');
    setShowManualFields(false);
    setIsApiOffline(false);
    setTouchedFields(new Set());
    setHighlightFields(new Set());
    setPostcodeError('');
  };

  const handleBackToSearch = () => {
    setShowManualFields(false);
    setSearchError('');
    setSuggestions([]);
    setSuggestionObjects([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // AIRTAIGHT GUARD CLAUSE: Clear all states at the very start
    setFormError('');
    setFormSuccess(false);
    let hasError = false;

    // Validate First Name
    if (!firstName) {
      setTouchedFields(prev => new Set(prev).add('firstName'));
      hasError = true;
    }

    // Validate Last Name
    if (!lastName) {
      setTouchedFields(prev => new Set(prev).add('lastName'));
      hasError = true;
    }

    // AIRTAIGHT GUARD CLAUSE: Check if user is in Search/Autocomplete mode
    if (!showManualFields) {
      // ABSOLUTE HALT: In search mode, validate that a valid address was selected
      // If user has NOT clicked/selected a verified address from dropdown, HALT execution
      // Also block if 'No matching address found' error is active
      if (!selectedAddress || searchError) {
        setFormError('Please select a valid address from the search results or use manual entry.');
        setFormSuccess(false);
        return; // COMPLETE HALT - code never reaches submit pipeline
      }
    } else {
      // In Manual Entry mode, validate required fields
      // Validate Street Address
      if (!streetAddress) {
        setTouchedFields(prev => new Set(prev).add('streetAddress'));
        hasError = true;
      }

      // Validate Suburb
      if (!suburb) {
        setTouchedFields(prev => new Set(prev).add('suburb'));
        hasError = true;
      }

      // Validate City
      if (!city) {
        setTouchedFields(prev => new Set(prev).add('city'));
        hasError = true;
      }

      // Validate Postcode
      if (!postcode || !postcodeRegex.test(postcode)) {
        setTouchedFields(prev => new Set(prev).add('postcode'));
        if (!postcode) {
          setPostcodeError('');
        } else if (!postcodeRegex.test(postcode)) {
          setPostcodeError('Postcode must be exactly 4 digits');
        }
        hasError = true;
      }
    }

    // AIRTAIGHT GUARD CLAUSE: If any validation errors exist, HALT execution
    if (hasError) {
      setFormError('Please fix the errors above before submitting.');
      setFormSuccess(false);
      return; // COMPLETE HALT - code never reaches submit pipeline
    }

    // Only reach this point if all validations pass
    // Success — show in-page success banner
    setFormSuccess(true);
  };

  const postcodeRegex = /^\d{4}$/;
  const isFormValid = firstName && lastName && (isApiOffline || searchAddress) && streetAddress && suburb && city && postcode && postcodeRegex.test(postcode);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">NZ Address Checker</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">HomeAddress</h2>

            {/* ── Inline success banner — appears below heading, above form fields ── */}
            {formSuccess && (
              <div
                id="successBanner"
                role="alert"
                style={{ position: 'static' }}
                className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4"
              >
                {/* Checkmark icon */}
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-green-800">Form submitted successfully!</p>
                  <p className="mt-0.5 text-sm text-green-700">Your address details have been recorded.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-900 mb-2">
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value, setFirstName)}
                    onBlur={() => handleFieldBlur('firstName')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400"
                    placeholder="Enter first name"
                  />
                  {touchedFields.has('firstName') && !firstName && (
                    <p className="text-red-600 text-sm mt-1">This field is required</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-900 mb-2">
                    Last Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value, setLastName)}
                    onBlur={() => handleFieldBlur('lastName')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400"
                    placeholder="Enter last name"
                  />
                  {touchedFields.has('lastName') && !lastName && (
                    <p className="text-red-600 text-sm mt-1">This field is required</p>
                  )}
                </div>
              </div>
              {!isApiOffline && !showManualFields && (
                <div>
                  <label htmlFor="searchAddress" className="block text-sm font-medium text-slate-900 mb-2">
                    Search Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="searchAddress"
                    value={searchAddress}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    onBlur={() => handleFieldBlur('searchAddress')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400"
                    placeholder="Search for an address"
                  />
                  {touchedFields.has('searchAddress') && !searchAddress && (
                    <p className="text-red-600 text-sm mt-1">This field is required</p>
                  )}
                </div>
              )}
              {isApiOffline && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">Address search is currently offline. Please enter your details manually below.</p>
                </div>
              )}
              {searchError && !isApiOffline && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                  <p className="text-red-600 font-medium">{searchError}</p>
                </div>
              )}
              {!isApiOffline && !showManualFields && (
                <p
                  onClick={handleManualEntry}
                  className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Can't find your address? Enter manually
                </p>
              )}
              {!isApiOffline && suggestions.length > 0 && (
                <div className="border border-gray-200 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectAddress(index)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors text-slate-900 border-b border-gray-200 last:border-b-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {showManualFields && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <button
                      type="button"
                      onClick={handleBackToSearch}
                      className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Back to address search
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="streetAddress" className="block text-sm font-medium text-slate-900 mb-2">
                    Street Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    ref={streetAddressRef}
                    type="text"
                    id="streetAddress"
                    value={streetAddress}
                    onChange={(e) => handleFieldChange('streetAddress', e.target.value, setStreetAddress)}
                    onBlur={() => handleFieldBlur('streetAddress')}
                    maxLength={100}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400 ${
                      highlightFields.has('streetAddress') ? 'bg-yellow-200' : ''
                    }`}
                    placeholder="Street address"
                  />
                  {touchedFields.has('streetAddress') && !streetAddress && (
                    <p className="text-red-600 text-sm mt-1">This field is required</p>
                  )}
                </div>
                <div>
                  <label htmlFor="suburb" className="block text-sm font-medium text-slate-900 mb-2">
                    Suburb <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="suburb"
                    value={suburb}
                    onChange={(e) => handleFieldChange('suburb', e.target.value, setSuburb)}
                    onBlur={() => handleFieldBlur('suburb')}
                    maxLength={50}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400 ${
                      highlightFields.has('suburb') ? 'bg-yellow-200' : ''
                    }`}
                    placeholder="Suburb"
                  />
                  {touchedFields.has('suburb') && !suburb && (
                    <p className="text-red-600 text-sm mt-1">This field is required</p>
                  )}
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-900 mb-2">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => handleFieldChange('city', e.target.value, setCity)}
                    onBlur={() => handleFieldBlur('city')}
                    maxLength={50}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400 ${
                      highlightFields.has('city') ? 'bg-yellow-200' : ''
                    }`}
                    placeholder="City"
                  />
                  {touchedFields.has('city') && !city && (
                    <p className="text-red-600 text-sm mt-1">This field is required</p>
                  )}
                </div>
                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-slate-900 mb-2">
                    Postcode <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="postcode"
                    value={postcode}
                    onChange={(e) => handlePostcodeChange(e.target.value)}
                    onBlur={() => handleFieldBlur('postcode')}
                    maxLength={4}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400 ${
                      highlightFields.has('postcode') ? 'bg-yellow-200' : ''
                    }`}
                    placeholder="Postcode"
                  />
                  {postcodeError && (
                    <p className="text-red-600 text-sm mt-1">{postcodeError}</p>
                  )}
                  {touchedFields.has('postcode') && !postcode && !postcodeError && (
                    <p className="text-red-600 text-sm mt-1">This field is required</p>
                  )}
                </div>
              </div>
                </>
              )}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">{formError}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium transition-all duration-150 ease-in-out hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 active:shadow-sm active:translate-y-[1px]"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
