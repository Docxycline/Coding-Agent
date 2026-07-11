#include <bits/stdc++.h>
using namespace std;

// Binary search - find target in sorted array
// Bug: should return -1 if not found, but has an off-by-one error
// that causes it to return wrong index or go out of bounds

int binarySearch(vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size(); // BUG: should be arr.size() - 1
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}

int main() {
    vector<int> arr = {1, 3, 5, 7, 9, 11, 13};
    
    cout << binarySearch(arr, 7) << endl;   // should print 3
    cout << binarySearch(arr, 1) << endl;   // should print 0
    cout << binarySearch(arr, 13) << endl;  // should print 6
    cout << binarySearch(arr, 4) << endl;   // should print -1
    
    return 0;
}