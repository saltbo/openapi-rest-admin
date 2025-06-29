import { useState } from 'react';
import type { ResourceDataItem } from '~/types/api';
import type { ActionType } from '../components/ResourceActionForm';

/**
 * 资源对话框状态管理 Hook
 * 统一管理表单对话框和删除确认对话框的状态
 */
export function useResourceDialogs(onRefresh?: () => void) {
  // 表单对话框状态
  const [showActionForm, setShowActionForm] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType>('create');
  const [selectedItem, setSelectedItem] = useState<ResourceDataItem | undefined>();

  // 删除确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ResourceDataItem | undefined>();

  // 通用的对话框操作
  const openActionForm = (action: ActionType, item?: ResourceDataItem) => {
    setCurrentAction(action);
    setSelectedItem(item);
    setShowActionForm(true);
  };

  const closeActionForm = () => {
    setShowActionForm(false);
    setSelectedItem(undefined);
  };

  const openDeleteConfirm = (item: ResourceDataItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(undefined);
  };

  // 成功处理（包含数据刷新）
  const handleSuccess = (closeDialog: () => void) => {
    closeDialog();
    onRefresh?.();
  };

  // 具体的事件处理器
  const handleAdd = () => openActionForm('create');
  const handleEdit = (item: ResourceDataItem) => openActionForm('edit', item);
  const handleDelete = (item: ResourceDataItem) => openDeleteConfirm(item);
  
  const handleFormSuccess = () => handleSuccess(closeActionForm);
  const handleDeleteSuccess = () => handleSuccess(closeDeleteConfirm);

  return {
    // 状态
    showActionForm,
    currentAction,
    selectedItem,
    showDeleteConfirm,
    itemToDelete,
    
    // 操作函数
    openActionForm,
    closeActionForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    
    // 事件处理器
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormSuccess,
    handleDeleteSuccess,
  };
}
