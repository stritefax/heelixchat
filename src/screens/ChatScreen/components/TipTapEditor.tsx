import {
  type FC,
  useState,
  useEffect,
} from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Box,
  Button,
  Flex,
  Alert,
  AlertDescription,
  Text,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from '@chakra-ui/react';
import { Edit2, Save, X } from 'lucide-react';

type TipTapEditorProps = {
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (content: string) => void;
  onCancel: () => void;
};

export const TipTapEditor: FC<TipTapEditorProps> = ({
  content,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      setHasChanges(editor.getHTML() !== content);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  const handleSave = () => {
    if (editor) {
      onSave(editor.getHTML());
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        editor?.commands.setContent(content);
        setHasChanges(false);
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <Card width="100%">
      <CardHeader display="flex" alignItems="center" justifyContent="space-between" pb={2}>
        <Text fontSize="lg" fontWeight="medium">Document Content</Text>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            leftIcon={<Edit2 size={16} />}
          >
            Edit
          </Button>
        )}
      </CardHeader>
      
      <CardBody>
        <Box>
          {hasChanges && isEditing && (
            <Alert status="info" mb={4}>
              <AlertDescription>
                You have unsaved changes
              </AlertDescription>
            </Alert>
          )}
          <Box 
            border="1px" 
            borderColor="gray.200" 
            borderRadius="md" 
            bg={isEditing ? 'white' : 'gray.50'}
          >
            <Box 
              minH="200px" 
              p={4}
              className="prose max-w-none"
            >
              <EditorContent editor={editor} />
            </Box>
          </Box>
        </Box>
      </CardBody>

      {isEditing && (
        <CardFooter display="flex" justifyContent="flex-end" gap={2}>
          <Button
            variant="outline"
            onClick={handleCancel}
            leftIcon={<X size={16} />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isDisabled={!hasChanges}
            leftIcon={<Save size={16} />}
          >
            Save Changes
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};