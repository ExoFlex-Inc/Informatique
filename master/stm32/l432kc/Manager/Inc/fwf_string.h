///
/// \file 		FWF_string.h
/// \brief 		Novo string utilities
///				
/// \author 	Frederic Lauzon
///
#ifndef __FWF_STRING_H__
#define __FWF_STRING_H__


/// \brief		FWF_Str_WildCompare()
/// \details	Wild string compare strings
///
/// \public
/// \param[in]	szMatch             String to match
/// \param[in]	szCmp               Match string, wildcards allowed (? and *)
/// \return	    bool                String match if true
FWF_INLINE bool FWF_Str_WildCompare(const char* szMatch, const char* szCmp)
{
    if (szMatch == NULL || szCmp == NULL)    
    {
        return false;
    }
    
    const char* cp = NULL;
    const char* mp = NULL;
    while ((*szCmp) && (*szMatch != '*')) 
    {
        if ((*szMatch != *szCmp) && (*szMatch != '?'))
        {
            return false;
        }
        ++szMatch;
        ++szCmp;
    }

    while (*szCmp) 
    {
        if (*szMatch == '*') 
        {
            if (!*++szMatch)
            {
                return true;
            }
            mp = szMatch;
            cp = szCmp + 1;
        } 
        else if ((*szMatch == *szCmp) || (*szMatch == '?')) 
        {
            ++szMatch;
            ++szCmp;
        } 
        else 
        {
            szMatch = mp;
            szCmp   = cp;
            ++cp;
        }
    }
  
    while(*szMatch == '*') 
    {
        ++szMatch;
    }
    return !*szMatch;
}

/// \brief		FWF_Str_IsSpace()
/// \details	Is input char a space character
///
/// \public
/// \param[in]	str                 Char to match
/// \return	    bool                Char is a space if true
FWF_INLINE bool FWF_Str_IsSpace(char str)
{
	return (str == ' ' || str == '\t' || str == '\n' || str == '\r');
}

/// \brief		FWF_Str_IsComment()
/// \details	Is input char a comment character
///
/// \public
/// \param[in]	str                 Char to match
/// \return	    bool                Char is a comment if true
FWF_INLINE bool FWF_Str_IsComment(char str)
{
	return (str == '#');
}

/// \brief		FWF_Str_TrimWhiteSpace()
/// \details	Trim whitespaces from str
///
/// \public
/// \param[in]	str                 String to trim
/// \return	    char*               Pointer to start of str after trimming
FWF_INLINE char* FWF_Str_TrimWhiteSpace(char *str)
{
	char *end;

	// Trim leading space
	while(FWF_Str_IsSpace((unsigned char)*str)) str++;

	if (*str == 0)
	{
		return str;
	}

	// Trim trailing space
	end = str + strlen(str) - 1;
	while(end > str && FWF_Str_IsSpace((unsigned char)*end)) end--;

	// Write new null terminator character
  	end[1] = '\0';
  	return str;
}

/// \brief		FWF_Str_IndexOfChar()
/// \details	Return index of character in string, -1 if not found
///
/// \public
/// \param[in]	str                 String to search from
/// \param[in]	testChar            Character to search for
/// \param[in]	len                 Length of input string
/// \return	    int                 Index of found character or -1 if not found
FWF_INLINE int FWF_Str_IndexOfChar(char* str, char testChar, int len)
{
	for (int a = 0; a < len; ++a)
	{
		if (str[a] == testChar)		
		{
			return a;
		}
	}
	return -1;
}

/// \brief		FWF_Str_Tokenize()
/// \details	Replace WhiteSpace and CrLf to '\0' and returns the number of tokens found and replaced
///
/// \public
/// \param[in]	str                 String to tokenize
/// \param[in]	len                 Length of input string
/// \return	    int                 Number of tokens found
FWF_INLINE int FWF_Str_Tokenize(char* str, int len)
{
	int tokenCount = 0;
	for (int a = 0; a < len; ++a)
	{
		if (FWF_Str_IsSpace(str[a]))
		{
			str[a] = '\0';
			++tokenCount;
		}
	}
	return tokenCount;
}

/// \brief		FWF_Str_TrimComment()
/// \details	Trim comment from string
///
/// \public
/// \param[in]	str                 String to trim
/// \return	    char*               Start of trimmed string from str
FWF_INLINE char* FWF_Str_TrimComment(char* str)
{
	int commentIdx = FWF_Str_IndexOfChar(str, '#', strlen(str));
	if (commentIdx != -1)
	{
		str[commentIdx] = '\0';
	}
	return str;
}

#endif // __FWF_STRING_H__
