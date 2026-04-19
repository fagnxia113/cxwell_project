import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config/api';
import { FormField, FormLayout, FormTemplate } from '../types/workflow';
import { useMessage } from './useMessage';

export function useFormDesigner(id: string | undefined) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error: showError } = useMessage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [layoutType, setLayoutType] = useState<FormLayout['type']>('single');
  const [layoutColumns, setLayoutColumns] = useState(2);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  // 1. Data Loader
  const loadTemplate = useCallback(async () => {
    if (!id || id === 'new') return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL.BASE}/api/workflow/form-templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const template: FormTemplate = data.data;
          setTemplateName(template.name);
          setLayoutType(template.layout.type);
          setLayoutColumns(template.layout.columns);
          setFields(template.fields || []);
        }
      }
    } catch (error) {
      console.error('Failed to load form template:', error);
      showError(t('form_designer_page.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [id, t, showError]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // 2. Field Operations
  const addField = () => {
    const newField: FormField = {
      name: `field_${fields.length + 1}`,
      label: `${t('form_designer_page.new_field_prefix')} ${fields.length + 1}`,
      type: 'text',
      required: false,
      layout: { width: 'half' },
      permissions: {
        default: {
          visible: true,
          editable: true,
          required: false
        }
      }
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const deleteField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(null);
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    
    setFields(prev => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(targetIndex);
    } else if (selectedFieldIndex === targetIndex) {
      setSelectedFieldIndex(index);
    }
  };

  // 3. Save Operation
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      showError(t('form_designer_page.enter_template_name'));
      return false;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const templateData = {
        name: templateName,
        layout: {
          type: layoutType,
          columns: layoutColumns,
          labelPosition: 'left'
        },
        fields: fields,
        style: {
          theme: 'default',
          size: 'medium',
          labelAlign: 'left'
        }
      };

      const url = id && id !== 'new' 
        ? `${API_URL.BASE}/api/workflow/form-templates/${id}` 
        : `${API_URL.BASE}/api/workflow/form-templates`;
      
      const method = id && id !== 'new' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      if (res.ok) {
        success(t('form_designer_page.save_success'));
        navigate('/forms/templates');
        return true;
      } else {
        const data = await res.json();
        showError(data.error || t('form_designer_page.save_failed'));
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      showError(t('form_designer_page.save_failed'));
    } finally {
      setSaving(false);
    }
    return false;
  };

  return {
    templateName,
    layoutType,
    layoutColumns,
    fields,
    selectedFieldIndex,
    previewMode,
    previewData,
    loading,
    saving,
    setTemplateName,
    setLayoutType,
    setLayoutColumns,
    setSelectedFieldIndex,
    setPreviewMode,
    setPreviewData,
    addField,
    updateField,
    deleteField,
    moveField,
    saveTemplate
  };
}
