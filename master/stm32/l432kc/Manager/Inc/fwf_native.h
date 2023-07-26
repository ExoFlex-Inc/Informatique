///
/// \file 		fwf_native.h
/// \brief 		Native system definitions and macros
///				
/// \author 	Frederic Lauzon
///
#ifndef __FWF_NATIVE_H__
#define __FWF_NATIVE_H__

#include <stdint.h>
#include <stdbool.h>
#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include <math.h>


typedef uint32_t				atomic_t;
typedef int32_t					fwfTime_t;
typedef uint32_t				fwfTimerange_t;

#define FWF_DEVICE_LT_ENDIAN		1

#define MIN(x,y) (((x) < (y)) ? (x) : (y) )
#define MAX(x,y) (((x) > (y)) ? (x) : (y) )

// Compiler specific macros
#define CONCAT(a,b) 			a##b
#define DEFTOSTR(x) 			#x
#define TOSTR(x) 				DEFTOSTR(x)

#if (FWF_ENABLE_ASSERT)
#define FWF_ASSERT(cond, retprocess, ...) \
	do{\
	if (!(cond))\
	{  \
        FWF_BREAKPOINT();\
		retprocess; \
	}}while(0)
#else
	
#define FWF_ASSERT(cond, retprocess, ...) (void)(cond);
#endif

#define FWF_COMPILATIONASSERT(name, x) typedef char name[x ? 1 : -1]

// Compiler switch
#if _MSC_VER >= 1600

#if _WIN64

#define FWF_ASM
#define FWF_BREAKPOINT()
#define FWF_NOP()
#else

#define FWF_ASM                  __asm
#define FWF_BREAKPOINT()			__asm {_emit 0xCC}
#define FWF_NOP()				__asm {_emit 0x90}

		
#endif
		
#define FWF_INLINE				__forceinline
#define FWF_ALIGN(n)				__pragma(pack(n))
#define FWF_PACK_PREFIX			__pragma(pack(1))
#define FWF_PACK_SUFFIX			__pragma(pack())
#define FWF_PACK_BEGIN
#define FWF_PACK_END
#define FWF_UNUSED				__attribute__ ((unused))

#define FWF_LINKSECTION_SRAM     //*** TODO
#define FWF_LINKSECTION_DTCM     //*** TODO
        
#elif __GNUC__ 

#if __i386__
#define FWF_ASM                  asm
#define FWF_BREAKPOINT()
#define FWF_NOP()
		
#elif __x86_64__
#define FWF_ASM                  asm
#define FWF_BREAKPOINT()
#define FWF_NOP()
		
#else // Assumes STM32
#define FWF_ASM                  __ASM
//#define FWF_BREAKPOINT()			__ASM volatile("BKPT #01")
#define FWF_NOP()				__ASM volatile("NOP")
		
#endif
		
#define FWF_INLINE				__attribute__((always_inline)) inline
#define FWF_ALIGN(n)				__attribute__((aligned (n)))
#define FWF_PACK_PREFIX
#define FWF_PACK_SUFFIX
#define FWF_PACK_BEGIN
#define FWF_PACK_END				__attribute__ ((packed, aligned (1)))
#define FWF_UNUSED				__attribute__ ((unused))
		
#define FWF_LINKSECTION_SRAM     //*** TODO
#define FWF_LINKSECTION_DTCM     //*** TODO
        
#elif __ICCARM__

#include "intrinsics.h"
#define FWF_ASM                  __asm
#define FWF_BREAKPOINT()			__asm volatile("BKPT #01")
#define FWF_NOP()				__no_operation()
#define FWF_INLINE				__attribute__((always_inline)) inline
#define FWF_ALIGN(n)				CONCAT(DECLARE_ALIGNED_,n)
  
#define DECLARE_ALIGNED_1 		_Pragma("data_alignment=1")
#define DECLARE_ALIGNED_4 		_Pragma("data_alignment=4")
#define DECLARE_ALIGNED_8 		_Pragma("data_alignment=8")
#define DECLARE_ALIGNED_16 		_Pragma("data_alignment=16")
#define DECLARE_ALIGNED_32 		_Pragma("data_alignment=32")
#define DECLARE_ALIGNED_256 	_Pragma("data_alignment=256")
  
		
#define FWF_PACK_PREFIX			__packed
#define FWF_PACK_SUFFIX
#define FWF_PACK_BEGIN
#define FWF_PACK_END
#define FWF_UNUSED

#define FWF_LINKSECTION_SRAM     _Pragma("location=\"SRAMData\"")
#define FWF_LINKSECTION_DTCM     _Pragma("location=\"DTCMData\"")
        
#else
	
#error Unsupported Compiler!

#endif
	

/// \union	FWF_BYTE_t
/// \brief	Byte type aliasing
FWF_PACK_PREFIX
union FWF_BYTE_t FWF_PACK_BEGIN
{
	uint8_t ub;
	int8_t 	b;
	struct
	{
		uint8_t B0:1;
		uint8_t B1:1;
		uint8_t B2:1;
		uint8_t B3:1;
		uint8_t B4:1;
		uint8_t B5:1;
		uint8_t B6:1;
		uint8_t B7:1;
	};
} FWF_PACK_END;
FWF_PACK_SUFFIX
FWF_COMPILATIONASSERT(assertFWF_ByteSize, (sizeof(union FWF_BYTE_t) == 1));

/// \union	FWF_WORD_t
/// \brief	Word type aliasing
FWF_PACK_PREFIX
union FWF_WORD_t FWF_PACK_BEGIN
{
	uint8_t 	ub[2];
	int8_t 		b[2];
	uint16_t 	ui;
	int16_t 	i;
} FWF_PACK_END;
FWF_PACK_SUFFIX
FWF_COMPILATIONASSERT(assertFWF_WordSize, (sizeof(union FWF_WORD_t) == 2));

/// \union	FWF_LONG_t
/// \brief	Long type aliasing
FWF_PACK_PREFIX
union FWF_LONG_t FWF_PACK_BEGIN
{
	uint8_t 	ub[4];
	int8_t 		b[4];
	uint16_t 	ui[2];
	int16_t 	i[2];
	uint32_t 	ul;
	int32_t 	l;
	float 		f;
} FWF_PACK_END;
FWF_PACK_SUFFIX
FWF_COMPILATIONASSERT(assertFWF_LongSize, (sizeof(union FWF_LONG_t) == 4));

/// \union	FWF_LONGLONG_t
/// \brief	LongLong type aliasing
FWF_PACK_PREFIX
union FWF_LONGLONG_t FWF_PACK_BEGIN
{
	uint8_t 	ub[8];
	int8_t 		b[8];
	uint16_t 	ui[4];
	int16_t 	i[4];
    uint32_t 	ul[2];
    int32_t 	l[2];
	uint64_t 	ull;
	int64_t 	ll;
	double 		f;
} FWF_PACK_END;
FWF_PACK_SUFFIX
FWF_COMPILATIONASSERT(assertFWF_LongLongSize, (sizeof(union FWF_LONGLONG_t) == 8));

/// \union	FWF_Int128_t
/// \brief	128bit integer type aliasing
FWF_PACK_PREFIX
union FWF_Int128_t FWF_PACK_BEGIN
{
	uint8_t 	ub[16];
	int8_t 		b[16];
	uint16_t 	ui[8];
	int16_t 	i[8];
    uint32_t 	ul[4];
    int32_t 	l[4];
	uint64_t 	ull[2];
	int64_t 	ll[2];
	double 		f[2];
} FWF_PACK_END;
FWF_PACK_SUFFIX
FWF_COMPILATIONASSERT(assertFWF_Int128Size, (sizeof(union FWF_Int128_t) == 16));

/// \union	FWF_Int256_t
/// \brief	256bit integer type aliasing
FWF_PACK_PREFIX
union FWF_Int256_t FWF_PACK_BEGIN
{
	uint8_t 	ub[32];
	int8_t 		b[32];
	uint16_t 	ui[16];
	int16_t 	i[16];
    uint32_t 	ul[8];
    int32_t 	l[8];
	uint64_t 	ull[4];
	int64_t 	ll[4];
	double 		f[4];
} FWF_PACK_END;
FWF_PACK_SUFFIX
FWF_COMPILATIONASSERT(assertFWF_Int256Size, (sizeof(union FWF_Int256_t) == 32));

/// \union	FWF_Int512_t
/// \brief	512bit integer type aliasing
FWF_PACK_PREFIX
union FWF_Int512_t FWF_PACK_BEGIN
{
	uint8_t 	ub[64];
	int8_t 		b[64];
	uint16_t 	ui[32];
	int16_t 	i[32];
    uint32_t 	ul[16];
    int32_t 	l[16];
	uint64_t 	ull[8];
	int64_t 	ll[8];
	double 		f[8];
} FWF_PACK_END;
FWF_PACK_SUFFIX
FWF_COMPILATIONASSERT(assertFWF_Int512Size, (sizeof(union FWF_Int512_t) == 64));


typedef union FWF_BYTE_t		FWF_Int8_t;
typedef union FWF_WORD_t		FWF_Int16_t;
typedef union FWF_LONG_t		FWF_Int32_t;
typedef union FWF_LONGLONG_t	FWF_Int64_t;
typedef union FWF_Int128_t	FWF_Int128_t;
typedef union FWF_Int256_t	FWF_Int256_t;
typedef union FWF_Int512_t	FWF_Int512_t;
	
static void FWF_Native_ComputeFreeHeapAndHalt(void)
{
	volatile uint32_t totalKB = 0;
	while(1)
	{
		void* p = malloc(1024);
		if (p == NULL)
		{
			while(1)
			{
				FWF_BREAKPOINT();
			}
		}
		totalKB += 1024;
	}
}
		
#endif // __FWF_NATIVE_H__
