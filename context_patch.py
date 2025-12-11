from django.template.context import BaseContext
from django.template.context import RequestContext

# Monkey patch the BaseContext.__copy__ method
original_copy = BaseContext.__copy__

def patched_copy(self):
    try:
        return original_copy(self)
    except AttributeError:
        # Create a new instance with the same dictionaries
        if isinstance(self, RequestContext):
            # For RequestContext, we need to pass the request
            result = self.__class__(self.request)
            
            # Copy important attributes
            if hasattr(self, '_processors_index'):
                result._processors_index = self._processors_index
            
            # Copy any other important attributes
            if hasattr(self, '_processors'):
                result._processors = self._processors
                
            if hasattr(self, '_processors_index'):
                result._processors_index = self._processors_index
                
            if hasattr(self, 'template'):
                result.template = self.template
        else:
            # For other context types
            result = self.__class__()
        
        # Copy dicts if they exist
        if hasattr(self, 'dicts'):
            result.dicts = self.dicts.copy()
            
        return result

BaseContext.__copy__ = patched_copy