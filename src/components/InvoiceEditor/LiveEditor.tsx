import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { debounce } from 'lodash';
import { useSession } from 'next-auth/react';
import { createSecureApiClient } from '../../lib/api';

const schema = yup.object().shape({
  clientEmail: yup.string().email().required(),
  items: yup.array().of(
    yup.object().shape({
      description: yup.string().max(200).required(),
      hours: yup.number().min(0).max(1000),
      rate: yup.number().min(0).max(10000)
    })
  ).min(1),
  terms: yup.string().oneOf(['net7', 'net15', 'net30', 'custom'])
});

export default function LiveEditor({ initialData }: { initialData?: InvoiceData }) {
  const { data: session } = useSession();
  const [preview, setPreview] = useState<string>();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>();
  const api = createSecureApiClient(session?.accessToken);

  const { control, watch, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      clientEmail: '',
      items: [{ description: '', hours: 0, rate: 0 }],
      terms: 'net15'
    }
  });

  // Secure auto-save
  const autoSave = debounce(async (data) => {
    if (!session) return;
    
    setIsAutoSaving(true);
    try {
      await api.patch('/v1/invoices/draft', data);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Secure save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, 2000);

  // Watch changes securely
  useEffect(() => {
    const subscription = watch((value) => {
      autoSave.cancel();
      autoSave(value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Generate preview
  const generatePreview = async () => {
    try {
      const response = await api.post('/v1/invoices/preview', watch());
      setPreview(URL.createObjectURL(response.data));
    } catch (error) {
      console.error('Preview generation failed:', error);
    }
  };

  return (
    <div className="editor-container">
      <div className="form-section">
        <Controller
          name="clientEmail"
          control={control}
          render={({ field }) => (
            <SecureInput
              {...field}
              label="Client Email"
              type="email"
              error={errors.clientEmail}
            />
          )}
        />

        {fields.map((field, index) => (
          <div key={field.id} className="item-row">
            <Controller
              name={`items.${index}.description`}
              control={control}
              render={({ field }) => (
                <SecureTextarea
                  {...field}
                  label="Description"
                  maxLength={200}
                  error={errors.items?.[index]?.description}
                />
              )}
            />
            {/* Rate/Hour inputs */}
          </div>
        ))}

        <button 
          type="button" 
          onClick={generatePreview}
          className="preview-button"
        >
          {isAutoSaving ? 'Saving...' : 'Generate Secure Preview'}
        </button>
      </div>

      {preview && (
        <div className="preview-section">
          <iframe 
            src={preview}
            className="pdf-preview"
            sandbox="allow-scripts allow-same-origin"
          />
          <div className="save-status">
            {lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
          </div>
        </div>
      )}
    </div>
  );
}

function SecureInput({ label, error, ...props }: any) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input 
        {...props}
        className={`secure-input ${error ? 'error' : ''}`}
        autoComplete="off"
        spellCheck="false"
      />
      {error && <span className="error-message">{error.message}</span>}
    </div>
  );
}