import { type FC, useState, useEffect } from "react";
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
  HStack, // Import HStack for button grouping
  IconButton,
} from '@chakra-ui/react';  
import { Edit2, Save, X, Bold, Italic, List } from 'lucide-react'; // Import icons

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
    <Box width="100%" maxWidth="var(--breakpoint-medium)" padding="var(--space-l)">
      <Card>
        <CardHeader display="flex" alignItems="center" justifyContent="space-between" pb={2}>
          <Text fontSize="lg" fontWeight="medium">Document Content</Text>
          <Flex alignItems="center">
            {isEditing ? (
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleSave}
                isDisabled={!hasChanges}
                leftIcon={<Save size={16} />}
              >
                Save
              </Button>
            ) : (
              <Button 
                variant="ghost"
                size="sm" 
                onClick={onEdit}
                leftIcon={<Edit2 size={16} />}
              >
                Edit
              </Button>
            )}
          </Flex>
        </CardHeader>
        
        <CardBody>
        {isEditing && (
  <HStack mb={4} spacing={2}>
    <IconButton // Changed to IconButton
      aria-label="Bold" // Important for accessibility
      icon={<Bold size={16} />}
      onClick={() => editor?.chain().focus().toggleBold().run()}
      isActive={editor?.isActive('bold')}
      variant={editor?.isActive('bold') ? 'solid' : 'outline'} // Visual active state
      size="sm"
    />
    <IconButton
      aria-label="Italic"
      icon={<Italic size={16} />}
      onClick={() => editor?.chain().focus().toggleItalic().run()}
      isActive={editor?.isActive('italic')}
      variant={editor?.isActive('italic') ? 'solid' : 'outline'}
      size="sm"
    />
    <IconButton
      aria-label="Bullet List"
      icon={<List size={16} />}
      onClick={() => editor?.chain().focus().toggleBulletList().run()}
      isActive={editor?.isActive('bulletList')}
      variant={editor?.isActive('bulletList') ? 'solid' : 'outline'}
      size="sm"
    />
    {/* Add more buttons like this for other formatting options */}
  </HStack>
          )}

<Box 
            border="1px"
            borderColor="white" 
            borderRadius="md"
            bg={isEditing ? 'white' : 'gray.50'}
            sx={{  // <-- Apply sx prop here
              ".ProseMirror": {
                outline: "none", // Remove outline
              },
              minH: "200px", // Keep existing styles
              p: 4,
              className: "prose max-w-none", // and class names...
              fontSize: "var(--font-size-m)",
              fontFamily: "var(--font-family-body)"
            }}
          >
            <EditorContent editor={editor} />
          </Box>
        </CardBody>

        {isEditing && (
          <CardFooter display="flex" justifyContent="flex-end">
            <Button
              variant="outline"
              onClick={handleCancel} 
              leftIcon={<X size={16} />}
            >
              Cancel
            </Button>
          </CardFooter>
        )}
      </Card>
    </Box>
  );
};